import { HaircutImage } from "@/components/haircut-image";
import { importedCorte, localCorte } from "@/lib/cortes";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { servicePriceLabel } from "@/lib/service-pricing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Servicios",
  description: "Conoce los servicios de Estilo y Greña en Guadalupe, Nuevo León. Consulta precios, duración y opciones de cotización.",
};

export default async function ServicesPage() {
  const services = process.env.DATABASE_URL
    ? await db.service
        .findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        })
        .catch(() => [])
    : [];
  return (
    <PublicShell>
      <main>
        <header className="border-b-2 border-white px-5 py-14 sm:px-10 sm:py-20">
          <p className="eyebrow text-white/55">Servicios / Precios en pesos mexicanos</p>
          <h1 className="display mt-4 text-7xl sm:text-9xl">Servicios</h1>
          <p className="mt-7 max-w-xl text-lg text-white/65">
            Consulta los servicios, su duración y precio.
            Algunos requieren cotización antes de tu cita.
          </p>
        </header>
        {services.length ? (
          <div className="grid lg:grid-cols-2">
            {services.map((service, index) => (
              <article
                className="group grid min-h-[390px] border-b border-white/50 lg:odd:border-r"
                key={service.id}
              >
                <div className="grid grid-cols-[72px_1fr]">
                  <div className="flex flex-col justify-between border-r border-white/35 p-4">
                    <span className="eyebrow text-white/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="-rotate-90 whitespace-nowrap text-[10px] font-black tracking-[.25em]">
                      ESTILO Y GREÑA
                    </span>
                  </div>
                  <div className="flex flex-col justify-between p-6 sm:p-8">
                    <div>
                      <h2 className="display text-4xl sm:text-5xl">
                        {service.name}
                      </h2>
                      <p className="mt-5 max-w-md text-white/60">
                        {service.description}
                      </p>
                    </div>
                    <div className="mt-10 flex items-end justify-between gap-4 border-t border-white/35 pt-5">
                      <span>
                        <b className={`block ${service.pricingType === "QUOTE" ? "max-w-52 text-base uppercase" : "text-2xl"}`}>
                          {servicePriceLabel(service, formatMoney)}
                        </b>
                        <small className="eyebrow text-white/45">
                          {service.pricingType === "QUOTE" ? "Cotización" : "Precio fijo"}
                        </small>
                      </span>
                      <span className="text-right">
                        <b className="block text-2xl">
                          {service.durationMinutes}
                        </b>
                        <small className="eyebrow text-white/45">Minutos</small>
                      </span>
                    </div>
                    <Link
                      className="btn mt-6 group-hover:bg-white group-hover:text-black"
                      href={`/agendar?servicio=${service.id}`}
                    >
                      Seleccionar servicio →
                    </Link>
                  </div>
                </div>
                {service.imageUrl && (
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden border-t border-white/40">
                    <HaircutImage
                      className="object-cover grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
                      src={service.imageUrl}
                      fallbackSrc={service.imageKey && importedCorte(service.imageKey) ? localCorte(importedCorte(service.imageKey)!.filename) : undefined}
                      alt={`Resultado de ${service.name}`}
                      fill
                      sizes="(max-width: 640px) 90vw, 384px"
                      style={{ objectPosition: service.imageKey ? importedCorte(service.imageKey)?.position ?? "50% 40%" : "50% 40%" }}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <section className="px-5 py-24 text-center sm:px-10">
            <p className="eyebrow text-white/45">Servicios en línea</p>
            <h2 className="display mt-4 text-5xl">No disponibles</h2>
            <p className="mx-auto mt-5 max-w-md text-white/60">
              Por ahora no hay servicios disponibles en línea. Contáctanos
              para consultar.
            </p>
          </section>
        )}
        <section className="flex flex-col items-start justify-between gap-8 bg-white px-5 py-14 text-black sm:flex-row sm:items-end sm:px-10">
          <div>
            <p className="eyebrow">Reserva en línea</p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">
              Agenda tu cita
            </h2>
          </div>
          <Link
            className="btn !border-black bg-black text-white hover:!bg-white hover:!text-black"
            href="/agendar"
          >
            Agenda tu cita →
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
