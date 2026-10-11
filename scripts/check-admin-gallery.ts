import "./load-env";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { requiredServerEnv, safeErrorCode } from "../lib/env";
import { deleteGalleryImage } from "../lib/gallery-management";
import { headImageObject } from "../lib/r2";

const base = process.env.WORKFLOW_APP_URL ?? "http://localhost:3000";
const url = new URL(base);
if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Esta prueba HTTP solo permite el servidor local.");
const tag = `Admin integration ${randomUUID()}`;
let cookie = "";
const ids: string[] = [];
const keys: string[] = [];
const forms = (html: string) => [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((match) => match[0]);

function actionData(form: string) {
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = /name="([^"]+)"/.exec(input[0])?.[1];
    const value = /value="([^"]*)"/.exec(input[0])?.[1] ?? "";
    if (name) data.set(name, value);
  }
  assert([...data.keys()].some((name) => name.startsWith("$ACTION_")), "No se encontró la referencia de Server Action.");
  return data;
}
async function get(path: string) {
  const response = await fetch(`${base}${path}`, { headers: cookie ? { Cookie: cookie } : {}, redirect: "manual" });
  assert.equal(response.status, 200);
  return response.text();
}
async function submit(path: string, data: FormData) {
  const response = await fetch(`${base}${path}`, { method: "POST", body: data, headers: { Origin: url.origin, ...(cookie ? { Cookie: cookie } : {}) }, redirect: "manual" });
  assert(response.status < 400, `Server Action HTTP ${response.status}`);
  return response;
}
async function main() {
  const login = forms(await get("/admin/login")).find((form) => form.includes('name="password"'));
  assert(login);
  const data = actionData(login);
  data.set("username", requiredServerEnv("ADMIN_USERNAME"));
  data.set("password", requiredServerEnv("ADMIN_PASSWORD"));
  const response = await submit("/admin/login", data);
  assert(!response.headers.get("location")?.includes("error="));
  cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  assert(cookie.includes("eg_admin="));
  console.log("Admin HTTP: login y acceso autenticado correctos.");
  const bytes = await readFile("public/images/cortes/corte-004.jpeg");
  for (let index = 0; index < 2; index++) {
    const uploadForm = forms(await get("/admin/galeria")).find((form) => form.includes('name="file"'));
    assert(uploadForm);
    const upload = actionData(uploadForm);
    upload.set("file", new File([bytes], "test.jpeg", { type: "image/jpeg" }));
    upload.set("alt", `${tag} ${index}`);
    await submit("/admin/galeria", upload);
    const image = await db.galleryImage.findFirstOrThrow({ where: { alt: `${tag} ${index}` } });
    ids.push(image.id); keys.push(image.objectKey);
    await headImageObject(image.objectKey);
    const publicRead = await fetch(image.url, { signal: AbortSignal.timeout(20_000) });
    assert(publicRead.ok);
    assert.deepEqual(Buffer.from(await publicRead.arrayBuffer()), bytes);
  }
  assert((await get("/galeria")).includes(tag));
  let html = await get("/admin/galeria");
  const move = forms(html).find((form) => form.includes(`value="${ids[1]}"`) && form.includes('name="direction"'));
  assert(move);
  const before = await db.galleryImage.findUniqueOrThrow({ where: { id: ids[1] } });
  const moveData = actionData(move); moveData.set("direction", "up");
  await submit("/admin/galeria", moveData);
  assert((await db.galleryImage.findUniqueOrThrow({ where: { id: ids[1] } })).displayOrder < before.displayOrder);
  for (const expected of [false, true]) {
    html = await get("/admin/galeria");
    const toggle = forms(html).find((form) => form.includes(`value="${ids[0]}"`) && (form.includes("Ocultar") || form.includes("Mostrar")));
    assert(toggle);
    const toggleData = actionData(toggle); toggleData.set("id", ids[0]);
    await submit("/admin/galeria", toggleData);
    assert.equal((await db.galleryImage.findUniqueOrThrow({ where: { id: ids[0] } })).isActive, expected);
    const publicHtml = await get("/galeria");
    assert.equal(publicHtml.includes(`${tag} 0`), expected);
  }
  for (const id of ids) {
    html = await get("/admin/galeria");
    const deletion = forms(html).find((form) => form.includes(`value="${id}"`) && form.includes("Eliminar"));
    assert(deletion);
    const deletionData = actionData(deletion); deletionData.set("id", id);
    await submit("/admin/galeria", deletionData);
    assert.equal(await db.galleryImage.findUnique({ where: { id } }), null);
  }
  for (const key of keys) await assert.rejects(headImageObject(key), (error: unknown) => (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404);
  assert(!(await get("/galeria")).includes(tag));
  console.log("Admin HTTP: upload, registro, R2, URL pública, galería, orden, ocultar/mostrar y borrado verificados; sin registros temporales.");
}
main().catch((error) => { console.error(`Admin HTTP: FALLÓ (${safeErrorCode(error)}).`); process.exitCode = 1; }).finally(async () => {
  try { for (const image of await db.galleryImage.findMany({ where: { alt: { startsWith: tag } } })) await deleteGalleryImage(image.id); }
  catch (error) { console.error(`Admin cleanup: ${safeErrorCode(error)}; prueba ${tag}.`); process.exitCode = 1; }
  await db.$disconnect();
});
