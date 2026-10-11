import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { DateTime } from "luxon";
import { db } from "../lib/db";
import { createBooking } from "../lib/bookings";
import { getAvailability } from "../lib/availability";
import { createGalleryImage, deleteGalleryImage, moveGalleryImage, toggleGalleryImage } from "../lib/gallery-management";
import { headImageObject } from "../lib/r2";
import { safeErrorCode } from "../lib/env";
import { SALON_TIMEZONE } from "../lib/constants";

const runId = randomUUID();
const serviceIds: string[] = [];
const galleryIds: string[] = [];
const keys: string[] = [];

async function main() {
  const initial = await db.appointment.count();
  const [services, schedule] = await Promise.all([db.service.count(), db.weeklySchedule.count()]);
  assert(services > 0 && schedule > 0);
  for (const pricingType of ["FIXED", "QUOTE"] as const) {
    const service = await db.service.create({ data: { slug: `integration-${runId}-${pricingType.toLowerCase()}`, name: "Prueba temporal de integración", description: "Registro temporal; se elimina al terminar.", pricingType, priceCents: pricingType === "FIXED" ? 12345 : null, quoteLabel: pricingType === "QUOTE" ? "Cotización de prueba" : null, durationMinutes: 30 } });
    serviceIds.push(service.id);
  }
  const input = { customerName: "Prueba de integración", phone: "+528100000001", paymentMethod: "CASH" as const };
  let date = "";
  let time = "";
  for (let offset = 1; offset <= 14; offset++) {
    const candidate = DateTime.now().setZone(SALON_TIMEZONE).plus({ days: offset }).toISODate()!;
    const slots = await getAvailability(candidate, serviceIds[0]);
    if (slots.length >= 2) { date = candidate; time = slots[0]; break; }
  }
  assert(date && time, "No hay disponibilidad para la prueba en los próximos 14 días.");
  const fixed = await createBooking({ ...input, serviceId: serviceIds[0], date, time });
  const fixedRow = await db.appointment.findUniqueOrThrow({ where: { bookingCode: fixed.bookingCode } });
  assert.equal(fixedRow.amountCents, 12345);
  assert.equal(fixedRow.status, "CONFIRMED");
  assert.equal(fixedRow.paymentStatus, "NOT_REQUIRED");
  assert(!(await getAvailability(date, serviceIds[0])).includes(time));
  await assert.rejects(createBooking({ ...input, serviceId: serviceIds[0], date, time }), /SLOT_UNAVAILABLE/);
  // Exercise the actual PostgreSQL exclusion constraint independently of availability.
  const { id: _id, createdAt: _created, updatedAt: _updated, ...duplicate } = fixedRow;
  void _id; void _created; void _updated;
  await assert.rejects(db.appointment.create({ data: { ...duplicate, bookingCode: `TEST-${randomUUID()}` } }));
  const quoteTime = (await getAvailability(date, serviceIds[1]))[0];
  assert(quoteTime);
  const quote = await createBooking({ ...input, serviceId: serviceIds[1], date, time: quoteTime, paymentMethod: "QUOTE" });
  const quoteRow = await db.appointment.findUniqueOrThrow({ where: { bookingCode: quote.bookingCode } });
  assert.equal(quoteRow.amountCents, null);
  assert.equal(quoteRow.servicePricingTypeSnapshot, "QUOTE");
  assert.equal(quoteRow.serviceQuoteLabelSnapshot, "Cotización de prueba");
  assert.equal(quoteRow.paymentPreferenceId, null);
  console.log("Reservas: consultas, disponibilidad, precio fijo, cotización y bloqueo de solapamientos correctos; sin cobros.");

  const bytes = await readFile("public/images/cortes/corte-004.jpeg");
  for (let index = 0; index < 2; index++) {
    const image = await createGalleryImage(new File([bytes], "test.jpeg", { type: "image/jpeg" }), `Prueba temporal ${runId} ${index}`, false);
    galleryIds.push(image.id); keys.push(image.objectKey);
    assert(image.width && image.height);
    await headImageObject(image.objectKey);
    const publicRead = await fetch(image.url, { signal: AbortSignal.timeout(20_000) });
    assert(publicRead.ok);
    assert.deepEqual(Buffer.from(await publicRead.arrayBuffer()), bytes);
    assert(await db.galleryImage.findFirst({ where: { id: image.id, isActive: true } }));
  }
  const before = await db.galleryImage.findUniqueOrThrow({ where: { id: galleryIds[1] } });
  await moveGalleryImage(galleryIds[1], -1);
  const moved = await db.galleryImage.findUniqueOrThrow({ where: { id: galleryIds[1] } });
  assert(moved.displayOrder < before.displayOrder);
  await toggleGalleryImage(galleryIds[0]);
  assert.equal(await db.galleryImage.findFirst({ where: { id: galleryIds[0], isActive: true } }), null);
  await toggleGalleryImage(galleryIds[0]);
  assert(await db.galleryImage.findFirst({ where: { id: galleryIds[0], isActive: true } }));
  if (process.env.WORKFLOW_APP_URL) {
    const galleryPage = await fetch(`${process.env.WORKFLOW_APP_URL}/galeria`);
    assert(galleryPage.ok && (await galleryPage.text()).includes(`Prueba temporal ${runId}`));
    console.log("Galería: imagen temporal presente en el HTML público.");
  }
  console.log("Galería (lógica usada por admin): upload, registro, dimensiones, HEAD, lectura pública, orden y activar/ocultar correctos.");
  await cleanup();
  for (const key of keys) {
    await assert.rejects(headImageObject(key), (error: unknown) => (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404);
  }
  assert.equal(await db.appointment.count(), initial);
  console.log("Limpieza: citas, servicios, registros de galería y objetos temporales eliminados y verificados.");
}

async function cleanup() {
  for (const id of galleryIds) if (await db.galleryImage.findUnique({ where: { id } })) await deleteGalleryImage(id);
  await db.appointment.deleteMany({ where: { serviceId: { in: serviceIds } } });
  await db.service.deleteMany({ where: { id: { in: serviceIds } } });
}
main().catch((error) => { console.error(`Workflows: FALLÓ (${safeErrorCode(error)}).`); process.exitCode = 1; }).finally(async () => {
  try { await cleanup(); } catch (error) { console.error(`Cleanup: ${safeErrorCode(error)}; prueba ${runId}.`); process.exitCode = 1; }
  await db.$disconnect();
});
