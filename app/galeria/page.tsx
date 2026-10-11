import { GalleryGrid } from "@/components/gallery-grid";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getGalleryImages } from "@/lib/gallery";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Galería",
  description: "Conoce algunos de los cortes y trabajos de color de Estilo y Greña, peluquería en Guadalupe, Nuevo León.",
};

export default async function GalleryPage() {
  const images = await getGalleryImages();
  return (
    <PublicShell>
      <main>
        <header className="border-b-2 border-white px-5 py-14 sm:px-10 sm:py-20">
          <p className="eyebrow text-white/55">Nuestros trabajos / Guadalupe, Nuevo León</p>
          <h1 className="display mt-4 text-7xl sm:text-9xl">Galería</h1>
          <p className="mt-7 max-w-lg text-white/60">
            Conoce algunos de los cortes y trabajos de color que hemos realizado.
          </p>
        </header>
        {images.length ? (
          <div className="px-5 py-12 sm:px-10">
            <GalleryGrid images={images} />
          </div>
        ) : (
          <section className="grid min-h-[520px] place-items-center px-5 py-20">
            <div className="max-w-xl text-center">
              <p className="eyebrow mt-8 text-white/45">
                Galería
              </p>
              <h2 className="display mt-4 text-5xl">Sin fotos por ahora</h2>
              <p className="mt-5 text-white/60">
                Por ahora no hay fotos en la galería. Puedes ver algunos trabajos en la página de inicio.
              </p>
            </div>
          </section>
        )}
        <section className="flex flex-col items-start justify-between gap-8 border-t-2 border-white px-5 py-14 sm:flex-row sm:items-end sm:px-10">
          <div>
            <p className="eyebrow text-white/45">Reserva en línea</p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">
              Agenda tu cita
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
