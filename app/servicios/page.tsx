import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { servicePriceLabel } from "@/lib/service-pricing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Servicios",
  description: "Cortes alternativos, diseño, fleco y color en Monterrey.",
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
          <p className="eyebrow text-white/55">Catálogo / Precios en MXN</p>
          <h1 className="display mt-4 text-7xl sm:text-9xl">Servicios.</h1>
          <p className="mt-7 max-w-xl text-lg text-white/65">
            Elige la base. En la silla afinamos la forma, la textura y el nivel
            de ruido.
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
                          {service.pricingType === "QUOTE" ? "Cotización" : "Precio base"}
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
                      Elegir este servicio →
                    </Link>
                  </div>
                </div>
                {service.imageUrl && (
                  <div className="relative hidden min-h-64 overflow-hidden border-t border-white/40 sm:block">
                    <Image
                      className="object-cover grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
                      src={service.imageUrl}
                      alt={`Resultado de ${service.name}`}
                      fill
                      sizes="50vw"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <section className="px-5 py-24 text-center sm:px-10">
            <p className="eyebrow text-white/45">Catálogo en edición</p>
            <h2 className="display mt-4 text-5xl">Afilando las tijeras.</h2>
            <p className="mx-auto mt-5 max-w-md text-white/60">
              Los servicios estarán disponibles aquí muy pronto. Escríbenos para
              consultar.
            </p>
          </section>
        )}
        <section className="flex flex-col items-start justify-between gap-8 bg-white px-5 py-14 text-black sm:flex-row sm:items-end sm:px-10">
          <div>
            <p className="eyebrow">¿Ya sabes qué quieres?</p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">
              Toma tu lugar.
            </h2>
          </div>
          <Link
            className="btn !border-black bg-black text-white hover:!bg-white hover:!text-black"
            href="/agendar"
          >
            Agenda →
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
