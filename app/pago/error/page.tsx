import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
export default function PaymentError() { return <PublicShell><main className="min-h-[620px] px-5 py-20 sm:px-10"><p className="eyebrow">Estado del pago</p><h1 className="display mt-4 text-6xl sm:text-8xl">Pago<br />incompleto</h1><p className="mt-8 max-w-lg text-white/70">No pudimos confirmar el pago. Revisa su estado en Mercado Pago antes de volver a intentarlo.</p><Link className="btn btn-light mt-10" href="/agendar">Volver a la agenda →</Link></main></PublicShell>; }
