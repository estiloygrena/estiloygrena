import type { GalleryImage } from "@prisma/client";
import { HaircutImage } from "@/components/haircut-image";
import { importedCorte, localCorte } from "@/lib/cortes";

export function GalleryGrid({ images, paper = false }: { images: readonly GalleryImage[]; paper?: boolean }) {
  return <div className="gallery-grid">
    {images.map((image, index) => {
      const local = importedCorte(image.objectKey);
      return <figure key={image.id} className={`gallery-shot group ${paper ? "border-black" : "border-white/50"} ${image.isFeatured || index === 0 ? "gallery-feature" : ""}`}>
        <HaircutImage src={image.url} fallbackSrc={local ? localCorte(local.filename) : undefined} alt={image.alt || `Trabajo de Estilo y Greña ${index + 1}`} width={image.width ?? 800} height={image.height ?? 1100} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px" className="h-auto w-full grayscale transition duration-500 group-hover:grayscale-0" />
        <figcaption className="flex items-start gap-3 border-t border-current px-3 py-3 text-[10px] font-bold uppercase tracking-wider"><span className="opacity-50">{String(index + 1).padStart(2, "0")}</span><span>{image.alt || "Trabajo de Estilo y Greña"}</span></figcaption>
      </figure>;
    })}
  </div>;
}
