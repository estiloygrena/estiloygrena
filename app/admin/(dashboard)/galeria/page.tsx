import Image from "next/image";
import {
  deleteGalleryAction,
  moveGalleryAction,
  toggleGalleryAction,
  uploadGalleryAction,
} from "@/app/admin/actions";
import { db } from "@/lib/db";
import { SubmitButton } from "@/components/submit-button";

export default async function GalleryAdminPage() {
  const images = await db.galleryImage.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return (
    <main className="p-5 sm:p-8">
      <p className="eyebrow">Cloudflare R2 / Archivo</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">Galería.</h1>
      <form
        action={uploadGalleryAction}
        className="mt-8 grid gap-4 border-2 border-black bg-white p-5 sm:grid-cols-2"
      >
        <label>
          <span className="label">Imagen (máx. 10 MB)</span>
          <input
            className="field !border-black !text-black"
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
          />
        </label>
        <label>
          <span className="label">Texto alternativo</span>
          <input
            className="field !border-black !text-black"
            name="alt"
            placeholder="Corte mullet con textura"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" /> <b>Destacada</b>
        </label>
        <SubmitButton className="btn !border-black bg-black text-white sm:col-span-2" pendingText="Subiendo imagen…">
          Subir a R2
        </SubmitButton>
      </form>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => (
          <article
            className={`border-2 border-black bg-white ${!image.isActive ? "opacity-50" : ""}`}
            key={image.id}
          >
            <div className="relative aspect-[4/5] bg-black">
              <Image
                className="object-cover grayscale"
                src={image.url}
                alt={image.alt ?? "Imagen de galería"}
                fill
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </div>
            <div className="p-4">
              <p className="truncate text-sm">
                {image.alt || "Sin texto alternativo"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={moveGalleryAction}>
                  <input type="hidden" name="id" value={image.id} />
                  <SubmitButton
                    className="btn !min-h-9 !border-black !px-2 !py-1 text-[10px]"
                    name="direction"
                    value="up"
                    aria-label="Mover hacia arriba"
                    pendingText="…"
                  >
                    ↑
                  </SubmitButton>
                  <SubmitButton
                    className="btn !min-h-9 !border-black !px-2 !py-1 text-[10px]"
                    name="direction"
                    value="down"
                    aria-label="Mover hacia abajo"
                    pendingText="…"
                  >
                    ↓
                  </SubmitButton>
                </form>
                <form action={toggleGalleryAction}>
                  <SubmitButton
                    className="btn !min-h-9 !border-black !px-2 !py-1 text-[10px]"
                    name="id"
                    value={image.id}
                    pendingText="…"
                  >
                    {image.isActive ? "Ocultar" : "Mostrar"}
                  </SubmitButton>
                </form>
                <form action={deleteGalleryAction}>
                  <SubmitButton
                    className="btn !min-h-9 !border-black bg-black !px-2 !py-1 text-[10px] text-white"
                    name="id"
                    value={image.id}
                    pendingText="…"
                  >
                    Eliminar
                  </SubmitButton>
                </form>
              </div>
            </div>
          </article>
        ))}
        {!images.length && (
          <div className="border-2 border-black bg-white p-8 sm:col-span-2 xl:col-span-3">
            <p className="eyebrow opacity-45">Archivo vacío</p>
            <h2 className="display mt-3 text-4xl">Sube la primera foto.</h2>
            <p className="mt-4 max-w-lg text-black/55">
              Las imágenes activas aparecerán en la portada, la galería y los
              collages laterales.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
