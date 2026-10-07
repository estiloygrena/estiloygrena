import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { createBooking } from "@/lib/bookings";

export async function POST(request: Request) {
  try {
    const result = await createBooking(await request.json());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2004", "P2034"].includes(error.code)) return NextResponse.json({ error: "Ese horario acaba de ser reservado. Selecciona otro." }, { status: 409 });
    if (error instanceof Error && ["QUOTE_PAYMENT_METHOD_REQUIRED", "FIXED_PAYMENT_METHOD_REQUIRED", "FIXED_PRICE_REQUIRED", "ONLINE_PAYMENT_NOT_ALLOWED"].includes(error.message)) return NextResponse.json({ error: "La forma de pago no está disponible para este servicio." }, { status: 400 });
    if (error instanceof Error && ["SLOT_UNAVAILABLE", "PAST_DATE"].includes(error.message)) return NextResponse.json({ error: error.message === "PAST_DATE" ? "No puedes reservar una fecha pasada." : "Ese horario acaba de ser reservado. Selecciona otro." }, { status: 409 });
    console.error("booking_create_failed", error);
    return NextResponse.json({ error: "No pudimos crear la cita. Intenta de nuevo." }, { status: 500 });
  }
}
