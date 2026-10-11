import "./load-env";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../lib/db";
import { requiredServerEnv, r2Config, safeErrorCode } from "../lib/env";
import { publicObjectUrl, r2Client } from "../lib/r2";

async function main() {
  let failed = false;
  try {
    requiredServerEnv("DATABASE_URL");
    await db.$queryRaw`SELECT 1`;
    console.log("DATABASE_URL: configurada. Neon: conexión y consulta correctas.");
    const [services, schedule, settings] = await Promise.all([db.service.count(), db.weeklySchedule.count(), db.siteSetting.count()]);
    console.log(`Neon: ${services} servicios, ${schedule} horarios, ${settings} ajustes.`);
  } catch (error) { console.error(`Neon: FALLÓ (${safeErrorCode(error)}). Revisa configuración y migraciones.`); failed = true; }

  let uploaded = false;
  const key = `healthchecks/${Date.now()}-${randomUUID()}.txt`;
  try {
    const c = r2Config();
    const client = r2Client();
    await client.send(new HeadBucketCommand({ Bucket: c.bucket }));
    console.log("R2: variables configuradas; bucket accesible.");
    const body = `estiloygrena-healthcheck-${randomUUID()}`;
    await client.send(new PutObjectCommand({ Bucket: c.bucket, Key: key, Body: body, ContentType: "text/plain", CacheControl: "no-store" }));
    uploaded = true;
    await client.send(new HeadObjectCommand({ Bucket: c.bucket, Key: key }));
    const retrieved = await client.send(new GetObjectCommand({ Bucket: c.bucket, Key: key }));
    if (await retrieved.Body?.transformToString() !== body) throw new Error("BodyMismatch");
    console.log("R2: upload, HEAD y lectura S3 correctos.");
    const publicRead = await fetch(publicObjectUrl(key), { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!publicRead.ok || await publicRead.text() !== body) {
      console.error(`R2 público: FALLÓ (HTTP ${publicRead.status}). En Cloudflare → R2 → bucket → Settings, verifica Public Development URL → Enable para r2.dev, o Custom Domains → dominio activo para tu host público.`);
      failed = true;
    } else console.log("R2 público: lectura y contenido verificados.");
  } catch (error) { console.error(`R2: FALLÓ (${safeErrorCode(error)}). Verifica variables, permisos de lectura/escritura y acceso público del bucket.`); failed = true; }
  finally {
    if (uploaded) {
      try {
        await r2Client().send(new DeleteObjectCommand({ Bucket: r2Config().bucket, Key: key }));
        try {
          await r2Client().send(new HeadObjectCommand({ Bucket: r2Config().bucket, Key: key }));
          throw new Error("DeleteNotVerified");
        } catch (error) { if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404) throw error; }
        console.log("R2: borrado verificado; objeto temporal eliminado.");
      } catch (error) { console.error(`R2 cleanup: FALLÓ (${safeErrorCode(error)}); objeto temporal ${key}.`); failed = true; }
    }
  }
  if (failed) process.exitCode = 1;
}
main().catch((error) => { console.error(safeErrorCode(error)); process.exitCode = 1; }).finally(() => db.$disconnect());
