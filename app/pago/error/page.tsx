import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
export default function PaymentError() { return <PublicShell><main className="min-h-[620px] px-5 py-20 sm:px-10"><p className="eyebrow">Pago no completado</p><h1 className="display mt-4 text-6xl sm:text-8xl">Algo<br />se cortó.</h1><p className="mt-8 max-w-lg text-white/70">No confirmamos ningún cargo. Puedes volver a la agenda y elegir otro horario.</p><Link className="btn btn-light mt-10" href="/agendar">Volver a agendar →</Link></main></PublicShell>; }
