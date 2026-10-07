import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Reveal } from "@/components/reveal";
import { Logo } from "@/components/logo";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { servicePriceLabel } from "@/lib/service-pricing";
import { LocationSection } from "@/components/location-section";

export const dynamic = "force-dynamic";

async function homeData() {
  if (!process.env.DATABASE_URL) return [[], []] as const;
  try {
    return await Promise.all([
      db.service.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      db.galleryImage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        take: 8,
      }),
    ]);
  } catch {
    return [[], []] as const;
  }
}

export default async function Home() {
  const [[services, gallery], settings] = await Promise.all([
    homeData(),
    getSettings(),
  ]);
  const heroImage = gallery[0];
  const conceptImage = gallery[1];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: settings.salonName,
    address: settings.address,
    url: process.env.NEXT_PUBLIC_APP_URL,
    sameAs: [settings.instagramUrl],
  };
  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <section
          id="inicio"
          className="relative min-h-[760px] overflow-hidden border-b-2 border-white px-5 py-10 sm:px-10 sm:py-16"
        >
          <div className="relative z-10 lg:max-w-[58%]">
            <p className="eyebrow mb-8">Monterrey, NL / Est. 2026</p>
            <Logo />
            <h1 className="display mt-12 text-[clamp(4rem,10vw,8rem)] sm:mt-16">
              Cortes
              <br />
              <span className="text-transparent [-webkit-text-stroke:2px_white]">
                sin molde.
              </span>
            </h1>
            <p className="mt-8 max-w-md text-lg text-white/75">
              Cabello alternativo para gente que no pidió encajar. Corte, color
              y diseño sin plantilla.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/agendar" className="btn btn-light">
                Agenda tu cita →
              </Link>
              <Link href="/servicios" className="btn">
                Ver servicios
              </Link>
            </div>
          </div>
          <div className="relative mt-12 h-[360px] overflow-hidden border-2 border-white lg:absolute lg:-right-[5%] lg:top-8 lg:mt-0 lg:h-[78%] lg:w-[47%] lg:rotate-2">
            {heroImage ? (
              <Image
                className="object-cover grayscale contrast-125"
                src={heroImage.url}
                alt={
                  heroImage.alt ??
                  "Corte alternativo realizado por Estilo y Greña"
                }
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            ) : (
              <div className="poster-placeholder h-full !border-0" />
            )}
          </div>
          <span className="absolute bottom-7 right-7 hidden rotate-90 text-xs font-bold tracking-[.3em] sm:block">
            01 — MANIFIESTO
          </span>
        </section>
        <div className="marquee">
          <span>
            ✂ ESTILO Y GREÑA — CORTE / COLOR / RUIDO — MONTERREY — &nbsp; ✂
            ESTILO Y GREÑA — CORTE / COLOR / RUIDO — MONTERREY — &nbsp;
          </span>
        </div>
        <section id="servicios" className="px-5 py-20 sm:px-10">
          <Reveal>
            <p className="eyebrow text-white/60">02 / Lo que hacemos</p>
            <h2 className="display mt-4 text-6xl sm:text-8xl">Servicios</h2>
          </Reveal>
          <div className="mt-12 border-t-2 border-white">
            {services.length ? (
              services.map((service, index) => (
                <Reveal
                  key={service.id}
                  className="grid gap-4 border-b border-white/50 py-7 sm:grid-cols-[70px_1fr_auto_auto] sm:items-center"
                >
                  <span className="text-xs text-white/50">0{index + 1}</span>
                  <div>
                    <h3 className="text-2xl font-black uppercase">
                      {service.name}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-white/60">
                      {service.description}
                    </p>
                  </div>
                  <span className="eyebrow">{service.durationMinutes} min</span>
                  <span
                    className={`${service.pricingType === "QUOTE" ? "max-w-48 text-sm uppercase" : "text-xl"} font-black sm:text-right`}
                  >
                    {servicePriceLabel(service, formatMoney)}
                  </span>
                </Reveal>
              ))
            ) : (
              <div className="py-12 text-white/60">
                Los servicios aparecerán aquí después de cargar los datos
                iniciales.
              </div>
            )}
          </div>
          <Link href="/agendar" className="btn mt-10">
            Elegir servicio →
          </Link>
        </section>
        <section
          id="galeria"
          className="border-y-2 border-white bg-[var(--paper)] px-5 py-20 text-black sm:px-10"
        >
          <Reveal>
            <p className="eyebrow">03 / Archivo visual</p>
            <h2 className="display mt-4 text-6xl sm:text-8xl">
              Cabezas
              <br />
              reales.
            </h2>
          </Reveal>
          <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {gallery.length
              ? gallery.map((image, index) => (
                  <figure
                    className="mb-4 break-inside-avoid border-2 border-black bg-black"
                    key={image.id}
                  >
                    <Image
                      className="h-auto w-full grayscale transition duration-500 hover:grayscale-0"
                      src={image.url}
                      alt={
                        image.alt ?? `Trabajo de Estilo y Greña ${index + 1}`
                      }
                      width={image.width ?? 800}
                      height={image.height ?? (index % 2 ? 600 : 1100)}
                    />
                  </figure>
                ))
              : Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`poster-placeholder mb-4 !border-black ${index % 2 ? "h-56" : "h-96"}`}
                  />
                ))}
          </div>
        </section>
        <section
          id="nosotros"
          className="grid border-b-2 border-white lg:grid-cols-2"
        >
          <div className="relative min-h-[460px] overflow-hidden border-r-white lg:border-r">
            {conceptImage ? (
              <Image
                className="object-cover grayscale contrast-125"
                src={conceptImage.url}
                alt={conceptImage.alt ?? "Trabajo editorial de Estilo y Greña"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="poster-placeholder h-full !border-0" />
            )}
          </div>
          <Reveal className="flex flex-col justify-between px-5 py-16 sm:px-10">
            <div>
              <p className="eyebrow text-white/60">04 / Concepto</p>
              <h2 className="display mt-5 text-6xl sm:text-8xl">
                No
                <br />
                peinamos
                <br />
                personajes.
              </h2>
            </div>
            <p className="mt-16 max-w-md text-lg text-white/70">
              Escuchamos cómo vives, cómo te vistes y cuánto tiempo quieres
              dedicarle a tu pelo. Después cortamos. Técnica precisa,
              referencias raras y cero juicio.
            </p>
          </Reveal>
        </section>
        <LocationSection
          address={settings.address}
          googleMapsUrl={settings.googleMapsUrl}
        />
        <section className="bg-[var(--paper)] px-5 py-20 text-black sm:px-10">
          <p className="eyebrow">06 / Reserva</p>
          <div className="mt-6 flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <h2 className="display max-w-3xl text-6xl sm:text-8xl">
              Tu pelo.
              <br />
              Tus reglas.
            </h2>
            <Link
              className="btn !border-black bg-black text-white hover:!bg-white hover:!text-black"
              href="/agendar"
            >
              Agenda tu cita →
            </Link>
          </div>
        </section>
        <section
          id="contacto"
          className="grid gap-12 px-5 py-20 sm:px-10 lg:grid-cols-2"
        >
          <div>
            <p className="eyebrow text-white/60">07 / Contacto</p>
            <h2 className="display mt-5 text-5xl sm:text-7xl">
              Aquí
              <br />
              hacemos
              <br />
              ruido.
            </h2>
          </div>
          <div className="border-l border-white/50 pl-6">
            <p className="text-xl font-bold">{settings.address}</p>
            <div className="mt-8 grid gap-3">
              <a className="btn" href={settings.googleMapsUrl}>
                Abrir mapa ↗
              </a>
              <a
                className="btn"
                href={`https://wa.me/${settings.whatsappNumber}`}
              >
                WhatsApp ↗
              </a>
              <a className="btn" href={settings.instagramUrl}>
                Instagram ↗
              </a>
            </div>
            <p className="mt-8 text-sm text-white/50">
              Horarios sujetos a disponibilidad. Consulta la agenda en línea.
            </p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
