import { DateTime, Interval } from "luxon";
import type { AppointmentStatus, ExceptionType } from "@prisma/client";
import { db } from "@/lib/db";
import { ACTIVE_APPOINTMENT_STATUSES, DEFAULT_SLOT_INTERVAL, SALON_TIMEZONE } from "@/lib/constants";

export type TimeWindow = { start: DateTime; end: DateTime };
type WeeklyRow = { weekday: number; startTime: string; endTime: string };
type ExceptionRow = { type: ExceptionType | "CLOSED" | "CUSTOM_HOURS"; startTime: string | null; endTime: string | null };
type BusyRow = { startAt: Date; endAt: Date; status?: AppointmentStatus | string; pendingExpiresAt?: Date | null };

function atLocalTime(date: string, time: string) {
  return DateTime.fromISO(`${date}T${time}`, { zone: SALON_TIMEZONE });
}

export function getWorkingWindows(date: string, weekly: WeeklyRow[], exceptions: ExceptionRow[]): TimeWindow[] {
  const day = DateTime.fromISO(date, { zone: SALON_TIMEZONE });
  if (!day.isValid) return [];
  if (exceptions.some((exception) => exception.type === "CLOSED")) return [];
  const custom = exceptions.filter((exception) => exception.type === "CUSTOM_HOURS" && exception.startTime && exception.endTime);
  const source = custom.length ? custom : weekly.filter((row) => row.weekday === day.weekday % 7);
  return source.flatMap((row) => {
    if (!row.startTime || !row.endTime) return [];
    const start = atLocalTime(date, row.startTime);
    const end = atLocalTime(date, row.endTime);
    return start.isValid && end > start ? [{ start, end }] : [];
  });
}

export function calculateAvailableSlots(input: {
  date: string;
  durationMinutes: number;
  slotIntervalMinutes?: number;
  weekly: WeeklyRow[];
  exceptions: ExceptionRow[];
  blocked: BusyRow[];
  appointments: BusyRow[];
  now?: DateTime;
}) {
  const now = input.now ?? DateTime.now().setZone(SALON_TIMEZONE);
  const busy = [...input.blocked, ...input.appointments].filter((item) => {
    if (item.status === "CANCELLED") return false;
    if (item.status === "PENDING" && item.pendingExpiresAt && item.pendingExpiresAt <= now.toJSDate()) return false;
    return true;
  }).map((item) => Interval.fromDateTimes(DateTime.fromJSDate(item.startAt), DateTime.fromJSDate(item.endAt)));
  const slots: string[] = [];
  for (const window of getWorkingWindows(input.date, input.weekly, input.exceptions)) {
    for (let cursor = window.start; cursor.plus({ minutes: input.durationMinutes }) <= window.end; cursor = cursor.plus({ minutes: input.slotIntervalMinutes ?? DEFAULT_SLOT_INTERVAL })) {
      const candidate = Interval.fromDateTimes(cursor, cursor.plus({ minutes: input.durationMinutes }));
      if (cursor > now && !busy.some((interval) => interval.overlaps(candidate))) slots.push(cursor.toFormat("HH:mm"));
    }
  }
  return slots;
}

export async function getAvailability(date: string, serviceId: string, excludeAppointmentId?: string) {
  await db.appointment.updateMany({
    where: { status: "PENDING", paymentStatus: "PENDING", pendingExpiresAt: { lt: new Date() } },
    data: { status: "CANCELLED", paymentStatus: "FAILED" },
  });
  const dayStart = DateTime.fromISO(date, { zone: SALON_TIMEZONE }).startOf("day");
  if (!dayStart.isValid) return [];
  const dayEnd = dayStart.endOf("day");
  const [service, weekly, exceptions, blocked, appointments, intervalSetting] = await Promise.all([
    db.service.findFirst({ where: { id: serviceId, isActive: true } }),
    db.weeklySchedule.findMany({ orderBy: { sortOrder: "asc" } }),
    db.scheduleException.findMany({ where: { date: dayStart.toJSDate() } }),
    db.blockedPeriod.findMany({ where: { startAt: { lt: dayEnd.toJSDate() }, endAt: { gt: dayStart.toJSDate() } } }),
    db.appointment.findMany({ where: { id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined, startAt: { lt: dayEnd.toJSDate() }, endAt: { gt: dayStart.toJSDate() }, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } } }),
    db.siteSetting.findUnique({ where: { key: "slotIntervalMinutes" } }),
  ]);
  if (!service) return [];
  return calculateAvailableSlots({ date, durationMinutes: service.durationMinutes, slotIntervalMinutes: Number(intervalSetting?.value) || DEFAULT_SLOT_INTERVAL, weekly, exceptions, blocked, appointments });
}

export function localSlotToUtc(date: string, time: string, durationMinutes: number) {
  const start = atLocalTime(date, time);
  if (!start.isValid) throw new Error("INVALID_SLOT");
  return { startAt: start.toUTC().toJSDate(), endAt: start.plus({ minutes: durationMinutes }).toUTC().toJSDate() };
}
