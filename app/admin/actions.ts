"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertAdmin, checkLoginRateLimit, clearAdminSession, createAdminSession, validateAdminCredentials } from "@/lib/auth";
import { deleteImageObject, uploadImage } from "@/lib/r2";
import { getAvailability, localSlotToUtc } from "@/lib/availability";
import { loginSchema, serviceSchema } from "@/lib/validation";
import { slugify } from "@/lib/format";
import { DateTime } from "luxon";
import { DEFAULT_QUOTE_LABEL, SALON_TIMEZONE } from "@/lib/constants";

export async function loginAction(formData: FormData) {
  if (!(await checkLoginRateLimit())) redirect("/admin/login?error=demasiados-intentos");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !validateAdminCredentials(parsed.data.username, parsed.data.password)) redirect("/admin/login?error=credenciales");
  await createAdminSession(); redirect("/admin");
}
export async function logoutAction() { await clearAdminSession(); redirect("/admin/login"); }

export async function saveServiceAction(formData: FormData) {
  await assertAdmin(); const parsed = serviceSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Servicio inválido.");
  const { id, name, description, pricingType, durationMinutes, displayOrder, isActive } = parsed.data;
  const priceCents = pricingType === "FIXED" ? Math.round(Number(parsed.data.price) * 100) : null;
  const quoteLabel = pricingType === "QUOTE" ? parsed.data.quoteLabel || DEFAULT_QUOTE_LABEL : null;
  const previous = id ? await db.service.findUnique({ where: { id }, select: { imageKey: true } }) : null;
  const imageFile = formData.get("image");
  const uploaded = imageFile instanceof File && imageFile.size > 0 ? await uploadImage(imageFile, "services") : null;
  const removeImage = formData.get("removeImage") === "on";
  const imageData = uploaded ? { imageKey: uploaded.objectKey, imageUrl: uploaded.url } : removeImage ? { imageKey: null, imageUrl: null } : {};
  const data = { name, description, pricingType, priceCents, quoteLabel, durationMinutes, displayOrder, isActive, ...imageData };
  if (id) await db.service.update({ where: { id }, data });
  else await db.service.create({ data: { ...data, slug: `${slugify(name)}-${Date.now().toString(36)}` } });
  if (previous?.imageKey && (uploaded || removeImage)) await deleteImageObject(previous.imageKey).catch((error) => console.error("service_image_cleanup_failed", error));
  revalidatePath("/"); revalidatePath("/servicios"); revalidatePath("/agendar"); revalidatePath("/admin/servicios");
}
export async function archiveServiceAction(formData: FormData) { await assertAdmin(); await db.service.update({ where: { id: String(formData.get("id")) }, data: { isActive: false } }); revalidatePath("/"); revalidatePath("/admin/servicios"); }

export async function updateAppointmentAction(formData: FormData) {
  await assertAdmin(); const id = String(formData.get("id")); const status = String(formData.get("status"));
  if (!["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) throw new Error("Estado inválido.");
  await db.appointment.update({ where: { id }, data: { status: status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW", notes: String(formData.get("notes") ?? "").slice(0, 800) || null } });
  revalidatePath("/admin"); revalidatePath("/admin/citas"); revalidatePath("/admin/calendario");
}
export async function rescheduleAppointmentAction(formData: FormData) {
  await assertAdmin(); const id = String(formData.get("id")); const date = String(formData.get("date")); const time = String(formData.get("time"));
  const appointment = await db.appointment.findUnique({ where: { id } }); if (!appointment) throw new Error("Cita no encontrada.");
  const slots = await getAvailability(date, appointment.serviceId, id); if (!slots.includes(time)) throw new Error("Ese horario no está disponible.");
  const range = localSlotToUtc(date, time, appointment.serviceDurationSnapshot); await db.appointment.update({ where: { id }, data: { ...range, status: "CONFIRMED" } });
  revalidatePath("/admin/citas"); revalidatePath("/admin/calendario");
}

export async function replaceScheduleAction(formData: FormData) {
  await assertAdmin(); const rows: { weekday: number; startTime: string; endTime: string; sortOrder: number }[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const value = String(formData.get(`day-${weekday}`) ?? "").trim(); if (!value) continue;
    value.split(",").map((part) => part.trim()).filter(Boolean).forEach((part, sortOrder) => { const [startTime, endTime] = part.split("-").map((item) => item.trim()); if (/^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime < endTime) rows.push({ weekday, startTime, endTime, sortOrder }); });
  }
  await db.$transaction([db.weeklySchedule.deleteMany(), db.weeklySchedule.createMany({ data: rows })]); revalidatePath("/admin/horarios");
}
export async function createExceptionAction(formData: FormData) {
  await assertAdmin(); const date = new Date(`${String(formData.get("date"))}T00:00:00.000Z`); const type = String(formData.get("type")); if (Number.isNaN(date.getTime()) || !["CLOSED", "CUSTOM_HOURS"].includes(type)) throw new Error("Excepción inválida.");
  await db.scheduleException.create({ data: { date, type: type as "CLOSED" | "CUSTOM_HOURS", startTime: type === "CUSTOM_HOURS" ? String(formData.get("startTime")) : null, endTime: type === "CUSTOM_HOURS" ? String(formData.get("endTime")) : null, label: String(formData.get("label") ?? "").slice(0, 120) || null } }); revalidatePath("/admin/horarios");
}
export async function deleteExceptionAction(formData: FormData) { await assertAdmin(); await db.scheduleException.delete({ where: { id: String(formData.get("id")) } }); revalidatePath("/admin/horarios"); }
export async function createBlockAction(formData: FormData) {
  await assertAdmin(); const start = DateTime.fromISO(String(formData.get("startAt")), { zone: SALON_TIMEZONE }); const end = DateTime.fromISO(String(formData.get("endAt")), { zone: SALON_TIMEZONE }); if (!start.isValid || !end.isValid || start >= end) throw new Error("El bloqueo no es válido.");
  await db.blockedPeriod.create({ data: { startAt: start.toUTC().toJSDate(), endAt: end.toUTC().toJSDate(), reason: String(formData.get("reason") ?? "").slice(0, 120) || null } }); revalidatePath("/admin/bloqueos");
}
export async function deleteBlockAction(formData: FormData) { await assertAdmin(); await db.blockedPeriod.delete({ where: { id: String(formData.get("id")) } }); revalidatePath("/admin/bloqueos"); }

export async function uploadGalleryAction(formData: FormData) {
  await assertAdmin(); const file = formData.get("file"); if (!(file instanceof File) || file.size === 0) throw new Error("Selecciona una imagen.");
  const uploaded = await uploadImage(file); await db.galleryImage.create({ data: { ...uploaded, alt: String(formData.get("alt") ?? "").slice(0, 180) || null, isFeatured: formData.get("featured") === "on", displayOrder: await db.galleryImage.count() } }); revalidatePath("/"); revalidatePath("/admin/galeria");
}
export async function deleteGalleryAction(formData: FormData) { await assertAdmin(); const image = await db.galleryImage.delete({ where: { id: String(formData.get("id")) } }); await deleteImageObject(image.objectKey); revalidatePath("/"); revalidatePath("/admin/galeria"); }
export async function toggleGalleryAction(formData: FormData) { await assertAdmin(); const id = String(formData.get("id")); const image = await db.galleryImage.findUniqueOrThrow({ where: { id } }); await db.galleryImage.update({ where: { id }, data: { isActive: !image.isActive } }); revalidatePath("/"); revalidatePath("/admin/galeria"); }
export async function moveGalleryAction(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const direction = String(formData.get("direction")) === "up" ? -1 : 1;
  const image = await db.galleryImage.findUniqueOrThrow({ where: { id } });
  const neighbor = await db.galleryImage.findFirst({ where: direction < 0 ? { displayOrder: { lt: image.displayOrder } } : { displayOrder: { gt: image.displayOrder } }, orderBy: { displayOrder: direction < 0 ? "desc" : "asc" } });
  if (neighbor) await db.$transaction([db.galleryImage.update({ where: { id: image.id }, data: { displayOrder: neighbor.displayOrder } }), db.galleryImage.update({ where: { id: neighbor.id }, data: { displayOrder: image.displayOrder } })]);
  revalidatePath("/"); revalidatePath("/admin/galeria");
}

export async function saveSettingsAction(formData: FormData) {
  await assertAdmin(); const allowed = ["salonName", "tagline", "address", "instagramUrl", "whatsappNumber", "googleMapsUrl", "slotIntervalMinutes", "cancellationPolicy"];
  await db.$transaction(allowed.map((key) => db.siteSetting.upsert({ where: { key }, update: { value: String(formData.get(key) ?? "").slice(0, 2000) }, create: { key, value: String(formData.get(key) ?? "").slice(0, 2000) } }))); revalidatePath("/"); revalidatePath("/admin/configuracion");
}
