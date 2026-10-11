import { HaircutImage } from "@/components/haircut-image";
import { SIDE_CORTES, localCorte } from "@/lib/cortes";

export function SideCollages() {
  return <div className="side-collages pointer-events-none fixed inset-0 z-0" aria-hidden="true">
    {(["left", "right"] as const).map((side) => <aside className={`collage-rail collage-${side}`} key={side}>
      <div className="collage-strip">{SIDE_CORTES.slice(side === "left" ? 0 : 3, side === "left" ? 3 : 6).map((photo, index) => <div className={`collage-photo collage-photo-${index}`} key={photo.filename}>
        <HaircutImage src={localCorte(photo.filename)} alt="" fill sizes="(min-width: 1440px) 200px, 140px" className="object-cover grayscale contrast-110" style={{ objectPosition: photo.position }} />
        <span className="absolute bottom-2 left-2 bg-black px-2 py-1 text-[9px] font-bold tracking-widest">{photo.filename.slice(6, 9)} / EG</span>
      </div>)}</div>
    </aside>)}
  </div>;
}
