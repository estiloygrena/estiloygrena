import "server-only";
import { db } from "@/lib/db";
import { deleteImageObject, uploadImage } from "@/lib/r2";

export async function deleteUnusedImageObject(key: string) {
  const [gallery, services] = await Promise.all([db.galleryImage.count({ where: { objectKey: key } }), db.service.count({ where: { imageKey: key } })]);
  if (!gallery && !services) await deleteImageObject(key);
}

export async function createGalleryImage(file: File, alt: string | null, isFeatured: boolean) {
  const uploaded = await uploadImage(file);
  try {
    const max = await db.galleryImage.aggregate({ _max: { displayOrder: true } });
    return await db.galleryImage.create({ data: { ...uploaded, alt, isFeatured, displayOrder: (max._max.displayOrder ?? -1) + 1 } });
  } catch (error) { await deleteImageObject(uploaded.objectKey); throw error; }
}

export async function deleteGalleryImage(id: string) {
  const image = await db.galleryImage.findUniqueOrThrow({ where: { id } });
  // Delete R2 first so failed storage deletion leaves a retryable admin record.
  if (!(await db.service.count({ where: { imageKey: image.objectKey } }))) await deleteImageObject(image.objectKey);
  await db.galleryImage.delete({ where: { id } });
}

export async function toggleGalleryImage(id: string) {
  const image = await db.galleryImage.findUniqueOrThrow({ where: { id } });
  return db.galleryImage.update({ where: { id }, data: { isActive: !image.isActive } });
}

export async function moveGalleryImage(id: string, direction: -1 | 1) {
  return db.$transaction(async (tx) => {
    const image = await tx.galleryImage.findUniqueOrThrow({ where: { id } });
    const neighbor = await tx.galleryImage.findFirst({ where: direction < 0 ? { displayOrder: { lt: image.displayOrder } } : { displayOrder: { gt: image.displayOrder } }, orderBy: { displayOrder: direction < 0 ? "desc" : "asc" } });
    if (neighbor) {
      await tx.galleryImage.update({ where: { id: image.id }, data: { displayOrder: neighbor.displayOrder } });
      await tx.galleryImage.update({ where: { id: neighbor.id }, data: { displayOrder: image.displayOrder } });
    }
  });
}
