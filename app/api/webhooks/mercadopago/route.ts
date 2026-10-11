import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getVerifiedPayment } from "@/lib/mercadopago";

function validSignature(request: Request, dataId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=")));
  if (!parts.ts || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`id:${dataId};request-id:${requestId};ts:${parts.ts};`).digest("hex");
  const received = Buffer.from(parts.v1); const expectedBuffer = Buffer.from(expected);
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json() as { id?: string | number; type?: string; data?: { id?: string | number } };
    const paymentId = String(body.data?.id ?? url.searchParams.get("data.id") ?? "");
    if (!paymentId || !validSignature(request, paymentId)) return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
    const eventId = String(body.id ?? `${request.headers.get("x-request-id") ?? "event"}:${paymentId}`);
    const payment = await getVerifiedPayment(paymentId);
    const appointmentId = payment.external_reference;
    if (!appointmentId) return NextResponse.json({ ok: true });
    await db.$transaction(async (tx) => {
      await tx.paymentEvent.create({ data: { externalEventId: eventId, eventType: body.type ?? "payment", paymentId, payload: body as Prisma.InputJsonValue } });
      const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment || appointment.paymentMethod !== "MERCADO_PAGO" || appointment.amountCents === null || Math.round(Number(payment.transaction_amount) * 100) !== appointment.amountCents) return;
      if (payment.status === "approved") await tx.appointment.update({ where: { id: appointment.id }, data: { paymentId, paymentStatus: "PAID", status: appointment.pendingExpiresAt && appointment.pendingExpiresAt < new Date() ? "CANCELLED" : "CONFIRMED", pendingExpiresAt: null } });
      else if (["rejected", "cancelled"].includes(payment.status ?? "")) await tx.appointment.update({ where: { id: appointment.id }, data: { paymentId, paymentStatus: "FAILED", status: "CANCELLED", pendingExpiresAt: null } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ ok: true });
    console.error("mercadopago_webhook_failed");
    return NextResponse.json({ error: "Webhook no procesado." }, { status: 500 });
  }
}
