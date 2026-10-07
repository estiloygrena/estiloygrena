import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default async function PaymentSuccess({ searchParams }: { searchParams: Promise<{ cita?: string }> }) {
  const { cita } = await searchParams;
  return <PublicShell><main className="min-h-[620px] px-5 py-20 sm:px-10"><p className="eyebrow">Pago recibido / verificando</p><h1 className="display mt-4 text-6xl sm:text-8xl">Casi<br />listo.</h1><p className="mt-8 max-w-lg text-lg text-white/70">Mercado Pago nos avisará cuando el pago esté verificado. La confirmación no depende de esta pantalla.</p>{cita && <Link className="btn btn-light mt-10" href={`/cita/${encodeURIComponent(cita)}`}>Ver estado de mi cita →</Link>}</main></PublicShell>;
}
