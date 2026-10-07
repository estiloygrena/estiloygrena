import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Galería",
  description: "Archivo visual de cortes, color y diseño de Estilo y Greña.",
};

export default async function GalleryPage() {
  const images = process.env.DATABASE_URL
    ? await db.galleryImage
        .findMany({
          where: { isActive: true },
          orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
        })
        .catch(() => [])
    : [];
  return (
    <PublicShell>
      <main>
        <header className="border-b-2 border-white px-5 py-14 sm:px-10 sm:py-20">
          <p className="eyebrow text-white/55">Archivo visual / Monterrey</p>
          <h1 className="display mt-4 text-7xl sm:text-9xl">Galería.</h1>
          <p className="mt-7 max-w-lg text-white/60">
            Cortes reales. Texturas reales. Sin banco de imágenes.
          </p>
        </header>
        {images.length ? (
          <div className="columns-1 gap-0 sm:columns-2 lg:columns-3">
            {images.map((image, index) => (
              <figure
                className="group relative mb-0 break-inside-avoid overflow-hidden border-b border-r border-white/40 bg-black"
                key={image.id}
              >
                <Image
                  className="h-auto w-full grayscale contrast-110 transition duration-500 group-hover:scale-[1.025] group-hover:grayscale-0"
                  src={image.url}
                  alt={image.alt ?? `Trabajo de Estilo y Greña ${index + 1}`}
                  width={image.width ?? 900}
                  height={image.height ?? (index % 3 === 0 ? 1250 : 760)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-black/90 p-3 text-[10px] font-black uppercase tracking-[.18em] transition group-hover:translate-y-0 group-focus-within:translate-y-0">
                  {image.alt || `Archivo ${String(index + 1).padStart(2, "0")}`}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <section className="grid min-h-[520px] place-items-center px-5 py-20">
            <div className="max-w-xl text-center">
              <div className="mx-auto h-56 max-w-sm border-2 border-white p-3">
                <div className="poster-placeholder h-full !min-h-0" />
              </div>
              <p className="eyebrow mt-8 text-white/45">
                Archivo esperando material
              </p>
              <h2 className="display mt-4 text-5xl">Próximamente.</h2>
              <p className="mt-5 text-white/60">
                Aquí solo publicamos trabajo del salón. Nada de fotos genéricas
                mientras llegan los retratos reales.
              </p>
            </div>
          </section>
        )}
        <section className="flex flex-col items-start justify-between gap-8 border-t-2 border-white px-5 py-14 sm:flex-row sm:items-end sm:px-10">
          <div>
            <p className="eyebrow text-white/45">¿Te toca?</p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">
              Entra al archivo.
            </h2>
          </div>
          <Link className="btn btn-light" href="/agendar">
            Agenda tu cita →
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
