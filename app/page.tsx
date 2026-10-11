import { HaircutImage } from "@/components/haircut-image";
import { GalleryGrid } from "@/components/gallery-grid";
import { HERO_CORTE, EDITORIAL_CORTE, localCorte } from "@/lib/cortes";
import { getGalleryImages } from "@/lib/gallery";
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
      getGalleryImages().then((images) => images.slice(0, 8)),
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
  const heroImage = HERO_CORTE;
  const conceptImage = EDITORIAL_CORTE;
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
          className="relative overflow-hidden border-b-2 border-white px-5 py-10 sm:px-10 sm:py-16 lg:min-h-[760px]"
        >
          <div className="relative z-10 lg:max-w-[58%]">
            <p className="eyebrow mb-8">Peluquería en Guadalupe, Nuevo León</p>
            <Logo />
            <h1 className="display mt-12 text-[clamp(3.8rem,8vw,7rem)] sm:mt-16">
              Cortes
              <br />
              <span className="text-transparent [-webkit-text-stroke:2px_white]">
                y color.
              </span>
            </h1>
            <p className="mt-8 max-w-md text-lg text-white/75">
              Cortes alternativos, color y otros servicios de peluquería.
              Conoce nuestro trabajo y agenda tu próxima cita.
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
          <div className="relative mx-auto mt-12 aspect-[3/4] max-w-md overflow-hidden border-2 border-white lg:absolute lg:right-7 lg:top-12 lg:mt-0 lg:h-[650px] lg:w-[40%] lg:rotate-2">
            <HaircutImage className="object-cover grayscale contrast-110" src={localCorte(heroImage.filename)} alt={heroImage.alt} fill preload sizes="(max-width: 640px) 90vw, (max-width: 1024px) 448px, 416px" style={{ objectPosition: heroImage.position }} />
          </div>
          <span className="absolute bottom-7 right-7 hidden rotate-90 text-xs font-bold tracking-[.3em] sm:block">
            01 — ESTILO Y GREÑA
          </span>
        </section>
        <div className="marquee">
          <span>
            ✂ ESTILO Y GREÑA — CORTES / COLOR — GUADALUPE, NUEVO LEÓN — &nbsp; ✂
            ESTILO Y GREÑA — CORTES / COLOR — GUADALUPE, NUEVO LEÓN — &nbsp;
          </span>
        </div>
        <section id="servicios" className="px-5 py-20 sm:px-10">
          <Reveal>
            <p className="eyebrow text-white/60">02 / Servicios de peluquería</p>
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
                Por ahora no hay servicios disponibles en línea.
                Contáctanos para consultar.
              </div>
            )}
          </div>
          <Link href="/agendar" className="btn mt-10">
            Seleccionar servicio →
          </Link>
        </section>
        <section
          id="galeria"
          className="border-y-2 border-white bg-[var(--paper)] px-5 py-20 text-black sm:px-10"
        >
          <Reveal>
            <p className="eyebrow">03 / Galería</p>
            <h2 className="display mt-4 text-6xl sm:text-8xl">
              Nuestros
              <br />
              trabajos
            </h2>
          </Reveal>
          <div className="mt-12">
            {gallery.length ? <GalleryGrid images={gallery} paper /> : <p className="border-t-2 border-black py-8">Por ahora no hay fotos en la galería. Puedes ver algunos trabajos en esta página.</p>}
            <Link className="btn mt-8 !border-black" href="/galeria">Ver más trabajos →</Link>
          </div>
        </section>
        <section
          id="nosotros"
          className="grid border-b-2 border-white lg:grid-cols-2"
        >
          <div className="relative aspect-[3/4] overflow-hidden border-r-white lg:aspect-auto lg:min-h-[650px] lg:border-r">
            <HaircutImage className="object-cover grayscale contrast-110" src={localCorte(conceptImage.filename)} alt={conceptImage.alt} fill sizes="(max-width: 1024px) 100vw, 520px" style={{ objectPosition: conceptImage.position }} />
          </div>
          <Reveal className="flex flex-col justify-between px-5 py-16 sm:px-10">
            <div>
              <p className="eyebrow text-white/60">04 / Sobre nosotros</p>
              <h2 className="display mt-5 text-6xl sm:text-8xl">
                Sobre
                <br />
                nuestro
                <br />
                salón
              </h2>
            </div>
            <p className="mt-16 max-w-md text-lg text-white/70">
              Somos una peluquería en Guadalupe, Nuevo León, especializada
              en cortes alternativos. Aquí puedes conocer nuestros servicios
              y algunos de nuestros trabajos antes de agendar tu cita.
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
              Agenda
              <br />
              tu cita
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
              Ponte
              <br />
              en
              <br />
              contacto
            </h2>
          </div>
          <div className="border-l border-white/50 pl-6">
            <p className="text-xl font-bold">{settings.address}</p>
            <div className="mt-8 grid gap-3">
              <a className="btn" href={settings.googleMapsUrl}>
                Abrir mapa ↗
              </a>
              {settings.whatsappNumber && <a
                className="btn"
                href={`https://wa.me/${settings.whatsappNumber}`}
              >
                WhatsApp ↗
              </a>}
              {settings.instagramUrl && <a className="btn" href={settings.instagramUrl}>
                Instagram ↗
              </a>}
            </div>
            <p className="mt-8 text-sm text-white/50">
              Consulta las fechas y horarios disponibles en nuestra agenda en línea.
            </p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
