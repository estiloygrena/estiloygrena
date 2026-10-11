import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { createBooking } from "@/lib/bookings";
import { safeErrorCode } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const result = await createBooking(await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Revisa los datos de tu cita." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2004", "P2034"].includes(error.code)) return NextResponse.json({ error: "Ese horario ya no está disponible. Selecciona otro." }, { status: 409 });
    if (error instanceof Error && ["QUOTE_PAYMENT_METHOD_REQUIRED", "FIXED_PAYMENT_METHOD_REQUIRED", "FIXED_PRICE_REQUIRED", "ONLINE_PAYMENT_NOT_ALLOWED"].includes(error.message)) return NextResponse.json({ error: "Selecciona una forma de pago disponible para este servicio." }, { status: 400 });
    if (error instanceof Error && ["SLOT_UNAVAILABLE", "PAST_DATE"].includes(error.message)) return NextResponse.json({ error: error.message === "PAST_DATE" ? "Selecciona una fecha de hoy en adelante." : "Ese horario ya no está disponible. Selecciona otro." }, { status: 409 });
    console.error("booking_create_failed", safeErrorCode(error));
    return NextResponse.json({ error: "No pudimos reservar tu cita. Intenta de nuevo." }, { status: 500 });
  }
}
