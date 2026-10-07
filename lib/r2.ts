import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) throw new Error("Cloudflare R2 no está configurado.");
  return { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL };
}

function r2Client() { const c = config(); return new S3Client({ region: "auto", endpoint: `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: c.R2_ACCESS_KEY_ID, secretAccessKey: c.R2_SECRET_ACCESS_KEY } }); }

export async function uploadImage(file: File, folder: "gallery" | "services" = "gallery") {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!allowed.has(file.type)) throw new Error("Formato no permitido. Usa JPG, PNG, WebP o AVIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("La imagen no puede pesar más de 10 MB.");
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `${folder}/${crypto.randomUUID()}.${extension}`;
  const c = config();
  await r2Client().send(new PutObjectCommand({ Bucket: c.R2_BUCKET_NAME, Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type, CacheControl: "public, max-age=31536000, immutable" }));
  return { objectKey: key, url: `${c.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}` };
}

export async function deleteImageObject(key: string) { const c = config(); await r2Client().send(new DeleteObjectCommand({ Bucket: c.R2_BUCKET_NAME, Key: key })); }
