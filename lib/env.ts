import "server-only";

type ServerVariable = "DATABASE_URL" | "ADMIN_USERNAME" | "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET" | "MERCADO_PAGO_ACCESS_TOKEN" | "MERCADO_PAGO_WEBHOOK_SECRET" | "R2_ACCOUNT_ID" | "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY" | "R2_BUCKET_NAME" | "R2_PUBLIC_URL";

export function requiredServerEnv(name: ServerVariable) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`${name}: falta configuración.`);
  return value;
}

export function r2Config() {
  const accountId = requiredServerEnv("R2_ACCOUNT_ID");
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new Error("R2_ACCOUNT_ID: formato inválido.");
  const publicUrl = requiredServerEnv("R2_PUBLIC_URL");
  let url: URL;
  try { url = new URL(publicUrl); } catch { throw new Error("R2_PUBLIC_URL: URL inválida."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("R2_PUBLIC_URL: usa HTTPS sin credenciales ni parámetros.");
  return { accountId, accessKeyId: requiredServerEnv("R2_ACCESS_KEY_ID"), secretAccessKey: requiredServerEnv("R2_SECRET_ACCESS_KEY"), bucket: requiredServerEnv("R2_BUCKET_NAME"), publicUrl: url.toString().replace(/\/+$/, "") };
}

// SDK/Prisma errors can embed connection details. Report codes only.
export function safeErrorCode(error: unknown) {
  const candidate = error as { code?: string; name?: string; $metadata?: { httpStatusCode?: number } };
  const code = candidate?.code ?? candidate?.name ?? "Error";
  const safeCode = /^[A-Za-z0-9_]{1,70}$/.test(code) ? code : "Error";
  return `${safeCode}${candidate?.$metadata?.httpStatusCode ? ` (HTTP ${candidate.$metadata.httpStatusCode})` : ""}`;
}
