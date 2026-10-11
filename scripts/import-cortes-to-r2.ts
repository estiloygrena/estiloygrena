import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { db } from "../lib/db";
import { safeErrorCode } from "../lib/env";
import { CORTES } from "../lib/cortes";
import { getImageObject, headImageObject, publicObjectUrl, readImage, uploadImage } from "../lib/r2";

async function main() {
  await db.$queryRaw`SELECT 1`;
  const root = resolve("public/images/cortes");
  const files = (await readdir(root, { withFileTypes: true })).filter((file) => file.isFile()).map((file) => file.name).sort();
  if (!files.length) throw new Error("NoImages");
  let uploaded = 0;
  let created = 0;
  for (const filename of files) {
    if (!/^corte-\d{3}\.(jpe?g|png|webp|avif)$/.test(filename)) throw new Error("UncleanFilename");
    const type = /\.jpe?g$/.test(filename) ? "image/jpeg" : `image/${filename.split(".").pop()}`;
    const bytes = await readFile(resolve(root, filename));
    const file = new File([bytes], filename, { type });
    const image = await readImage(file);
    const objectKey = `gallery/cortes/${filename}`;
    let exists = true;
    try { await headImageObject(objectKey); }
    catch (error) { if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) exists = false; else throw error; }
    if (exists) {
      const remote = await getImageObject(objectKey);
      const remoteBytes = await remote.Body?.transformToByteArray();
      if (!remoteBytes || createHash("sha256").update(remoteBytes).digest("hex") !== createHash("sha256").update(bytes).digest("hex")) throw new Error("ExistingObjectDiffers");
    } else { await uploadImage(file, "gallery", objectKey); uploaded++; }
    const url = publicObjectUrl(objectKey);
    const publicRead = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!publicRead.ok || createHash("sha256").update(Buffer.from(await publicRead.arrayBuffer())).digest("hex") !== createHash("sha256").update(bytes).digest("hex")) throw new Error("PublicReadFailed");
    const curated = CORTES.find((photo) => photo.filename === filename);
    const previous = await db.galleryImage.findUnique({ where: { objectKey } });
    const max = previous ? undefined : await db.galleryImage.aggregate({ _max: { displayOrder: true } });
    await db.galleryImage.upsert({
      where: { objectKey },
      update: { url, width: image.width, height: image.height },
      create: { objectKey, url, width: image.width, height: image.height, alt: curated?.alt ?? "Corte realizado en Estilo y Greña", isFeatured: filename === "corte-001.jpeg", displayOrder: (max?._max.displayOrder ?? -1) + 1 },
    });
    if (!previous) created++;
    await db.service.updateMany({ where: { imageKey: objectKey, imageUrl: { not: url } }, data: { imageUrl: url } });
    console.log(JSON.stringify({ filename, objectKey, url }));
  }
  // Add representative photos only to existing seeded services without any image.
  let serviceImages = 0;
  for (const [slug, filename] of [["corte-alternativo", "corte-014.jpeg"], ["corte-diseno", "corte-007.jpeg"]]) {
    const objectKey = `gallery/cortes/${filename}`;
    const gallery = await db.galleryImage.findUnique({ where: { objectKey } });
    if (gallery) serviceImages += (await db.service.updateMany({ where: { slug, imageKey: null, imageUrl: null }, data: { imageKey: objectKey, imageUrl: gallery.url } })).count;
  }
  console.log(`Importación: ${uploaded} uploads, ${created} registros nuevos, ${serviceImages} imágenes de servicio asignadas.`);
}
main().catch((error) => { console.error(`Importación FALLÓ: ${safeErrorCode(error)}. No se sobrescriben objetos distintos. Si falla la lectura pública, verifica Settings → Public Development URL / Custom Domains de R2 antes de reintentar.`); process.exitCode = 1; }).finally(() => db.$disconnect());
