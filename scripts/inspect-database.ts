import "./load-env";
import { db } from "../lib/db";
import { safeErrorCode } from "../lib/env";

async function main() {
  await db.$queryRaw`SELECT 1`;
  console.log("Neon: conectado; SELECT 1 correcto.");
  const [services, schedules, gallery, appointments, settings] = await Promise.all([
    db.service.findMany({ select: { slug: true, pricingType: true, isActive: true, imageKey: true } }),
    db.weeklySchedule.count(), db.galleryImage.count(), db.appointment.count(), db.siteSetting.findMany(),
  ]);
  console.log(JSON.stringify({ services, schedules, gallery, appointments, settings: settings.map(({ key, value }) => ({ key, configured: Boolean(value), placeholder: value === "528100000000" })) }, null, 2));
}
main().catch((error) => { console.error(`Neon: ${safeErrorCode(error)}`); process.exitCode = 1; }).finally(() => db.$disconnect());
