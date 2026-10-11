import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailability } from "@/lib/availability";

const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), serviceId: z.string().min(1) });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Selecciona un servicio y una fecha válidos." }, { status: 400 });
  try { return NextResponse.json({ slots: await getAvailability(parsed.data.date, parsed.data.serviceId) }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "No pudimos consultar los horarios. Intenta de nuevo." }, { status: 500 }); }
}
