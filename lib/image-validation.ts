export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_MIME_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as const;

export function validateImageFile(file: Pick<File, "type" | "size">) {
  if (!Object.hasOwn(IMAGE_MIME_TYPES, file.type)) throw new Error("Formato no permitido. Usa JPG, PNG, WebP o AVIF.");
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error("Selecciona una imagen de hasta 10 MB.");
  return IMAGE_MIME_TYPES[file.type as keyof typeof IMAGE_MIME_TYPES];
}

export function validateImageKey(key: string) {
  if (!/^(gallery|services)\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/.test(key) || key.includes("..")) throw new Error("Clave de imagen inválida.");
  return key;
}
