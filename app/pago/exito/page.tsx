import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default async function PaymentSuccess({ searchParams }: { searchParams: Promise<{ cita?: string }> }) {
  const { cita } = await searchParams;
  return <PublicShell><main className="min-h-[620px] px-5 py-20 sm:px-10"><p className="eyebrow">Verificación de pago</p><h1 className="display mt-4 text-6xl sm:text-8xl">Pago<br />en revisión</h1><p className="mt-8 max-w-lg text-lg text-white/70">Estamos esperando la confirmación de Mercado Pago. Consulta el estado de tu cita para verificar si el pago se completó.</p>{cita && <Link className="btn btn-light mt-10" href={`/cita/${encodeURIComponent(cita)}`}>Ver estado de mi cita →</Link>}</main></PublicShell>;
}
