import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { calculateAvailableSlots, localSlotToUtc } from "@/lib/availability";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  DEFAULT_SLOT_INTERVAL,
  PAYMENT_HOLD_MINUTES,
  SALON_TIMEZONE,
} from "@/lib/constants";
import { createPaymentPreference } from "@/lib/mercadopago";
import { bookingSchema } from "@/lib/validation";
import {
  createServiceSnapshot,
  resolveBookingPricing,
} from "@/lib/service-pricing";

function bookingCode() {
  return `EG-${randomBytes(5).toString("base64url").toUpperCase().replace(/[_-]/g, "X").slice(0, 6)}`;
}

export async function createBooking(rawInput: unknown) {
  const input = bookingSchema.parse(rawInput);
  const appointment = await db.$transaction(
    async (tx) => {
      await tx.appointment.updateMany({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          pendingExpiresAt: { lt: new Date() },
        },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });
      const service = await tx.service.findFirst({
        where: { id: input.serviceId, isActive: true },
      });
      if (!service) throw new Error("SERVICE_NOT_FOUND");
      const pricing = resolveBookingPricing(service, input.paymentMethod);
      const snapshot = createServiceSnapshot(service);
      const { startAt, endAt } = localSlotToUtc(
        input.date,
        input.time,
        service.durationMinutes,
      );
      const dayStart = DateTime.fromISO(input.date, {
        zone: SALON_TIMEZONE,
      }).startOf("day");
      if (dayStart < DateTime.now().setZone(SALON_TIMEZONE).startOf("day"))
        throw new Error("PAST_DATE");
      const [weekly, exceptions, blocked, appointments, intervalSetting] =
        await Promise.all([
          tx.weeklySchedule.findMany(),
          tx.scheduleException.findMany({
            where: { date: dayStart.toJSDate() },
          }),
          tx.blockedPeriod.findMany({
            where: {
              startAt: { lt: dayStart.endOf("day").toJSDate() },
              endAt: { gt: dayStart.toJSDate() },
            },
          }),
          tx.appointment.findMany({
            where: {
              startAt: { lt: dayStart.endOf("day").toJSDate() },
              endAt: { gt: dayStart.toJSDate() },
              status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
            },
          }),
          tx.siteSetting.findUnique({ where: { key: "slotIntervalMinutes" } }),
        ]);
      const slots = calculateAvailableSlots({
        date: input.date,
        durationMinutes: service.durationMinutes,
        slotIntervalMinutes:
          Number(intervalSetting?.value) || DEFAULT_SLOT_INTERVAL,
        weekly,
        exceptions,
        blocked,
        appointments,
      });
      if (!slots.includes(input.time)) throw new Error("SLOT_UNAVAILABLE");
      return tx.appointment.create({
        data: {
          bookingCode: bookingCode(),
          customerName: input.customerName,
          phone: input.phone,
          email: input.email || null,
          instagram: input.instagram || null,
          notes: input.notes || null,
          serviceId: service.id,
          ...snapshot,
          startAt,
          endAt,
          timezone: SALON_TIMEZONE,
          status: pricing.appointmentStatus,
          paymentMethod: pricing.paymentMethod,
          paymentStatus: pricing.paymentStatus,
          amountCents: pricing.amountCents,
          pendingExpiresAt:
            pricing.paymentMethod === "MERCADO_PAGO"
              ? new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60_000)
              : null,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (appointment.paymentMethod !== "MERCADO_PAGO")
    return {
      bookingCode: appointment.bookingCode,
      redirectUrl: `/cita/${appointment.bookingCode}`,
    };
  try {
    const verifiedService = await db.service.findUnique({
      where: { id: appointment.serviceId },
      select: { pricingType: true, priceCents: true },
    });
    if (
      !verifiedService ||
      verifiedService.pricingType !== "FIXED" ||
      verifiedService.priceCents === null ||
      appointment.amountCents === null ||
      verifiedService.priceCents !== appointment.amountCents
    )
      throw new Error("ONLINE_PAYMENT_NOT_ALLOWED");
    const preference = await createPaymentPreference({
      appointmentId: appointment.id,
      bookingCode: appointment.bookingCode,
      serviceName: appointment.serviceNameSnapshot,
      amountCents: appointment.amountCents,
      customerEmail: appointment.email ?? undefined,
    });
    await db.appointment.update({
      where: { id: appointment.id },
      data: { paymentPreferenceId: preference.id },
    });
    if (!preference.init_point) throw new Error("PAYMENT_URL_MISSING");
    return {
      bookingCode: appointment.bookingCode,
      redirectUrl: preference.init_point,
    };
  } catch (error) {
    await db.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });
    throw error;
  }
}
