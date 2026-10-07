import Image from "next/image";
import { db } from "@/lib/db";

export async function SideCollages() {
  const images = process.env.DATABASE_URL
    ? await db.galleryImage
        .findMany({ where: { isActive: true }, orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }], take: 6 })
        .catch(() => [])
    : [];
  return <div className="pointer-events-none fixed inset-0 z-0 hidden xl:block" aria-hidden="true">
    {(["left", "right"] as const).map((side) => <aside className={`absolute inset-y-0 ${side}-0 w-[calc((100vw-1040px)/2)] overflow-hidden p-2 2xl:p-4`} key={side}><div className={`grid h-full gap-2 2xl:gap-4 ${side === "left" ? "grid-rows-[1.2fr_.8fr_1fr]" : "grid-rows-[.8fr_1.25fr_.75fr]"}`}>{Array.from({ length: 3 }).map((_, index) => { const image = images[index + (side === "right" ? 3 : 0)]; return image ? <div className={`relative overflow-hidden border border-white/30 ${side === "left" ? "odd:-rotate-1" : "even:rotate-1"}`} key={image.id}><Image className="object-cover grayscale contrast-125 transition duration-700" src={image.url} alt="" fill sizes="15vw" /></div> : <div className="poster-placeholder !min-h-0 opacity-70" key={index} />; })}</div></aside>)}
  </div>;
}
