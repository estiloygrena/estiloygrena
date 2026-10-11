import "server-only";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp, { type Metadata } from "sharp";
import { r2Config } from "@/lib/env";
import { validateImageFile, validateImageKey } from "@/lib/image-validation";

let client: S3Client | undefined;
export function r2Client() {
  const c = r2Config();
  return client ??= new S3Client({ region: "auto", endpoint: `https://${c.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey }, maxAttempts: 3, requestHandler: { connectionTimeout: 10_000, requestTimeout: 30_000 } });
}

export function publicObjectUrl(key: string) {
  return `${r2Config().publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function readImage(file: File) {
  const extension = validateImageFile(file);
  const body = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try { metadata = await sharp(body, { limitInputPixels: 40_000_000 }).metadata(); }
  catch { throw new Error("El archivo no contiene una imagen válida."); }
  const expectedFormat = file.type === "image/avif" ? "heif" : extension === "jpg" ? "jpeg" : extension;
  if (metadata.format !== expectedFormat || (file.type === "image/avif" && metadata.compression !== "av1") || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new Error("El contenido no coincide con el formato de imagen.");
  const rotated = metadata.orientation && metadata.orientation >= 5;
  return { extension, body, width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height };
}

export async function uploadImage(file: File, folder: "gallery" | "services" = "gallery", objectKey?: string) {
  const image = await readImage(file);
  const key = validateImageKey(objectKey ?? `${folder}/${crypto.randomUUID()}.${image.extension}`);
  await r2Client().send(new PutObjectCommand({ Bucket: r2Config().bucket, Key: key, Body: image.body, ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
  return { objectKey: key, url: publicObjectUrl(key), width: image.width, height: image.height };
}

export async function headImageObject(key: string) {
  return r2Client().send(new HeadObjectCommand({ Bucket: r2Config().bucket, Key: validateImageKey(key) }));
}

export async function getImageObject(key: string) {
  return r2Client().send(new GetObjectCommand({ Bucket: r2Config().bucket, Key: validateImageKey(key) }));
}

export async function deleteImageObject(key: string) {
  await r2Client().send(new DeleteObjectCommand({ Bucket: r2Config().bucket, Key: validateImageKey(key) }));
}
