import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getGalleryImages = cache(async () => {
  if (!process.env.DATABASE_URL) return [];
  return db.galleryImage.findMany({ where: { isActive: true }, orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { id: "asc" }] }).catch(() => []);
});
