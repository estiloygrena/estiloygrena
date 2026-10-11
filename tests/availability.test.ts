import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { calculateAvailableSlots } from "@/lib/availability";

const zone = "America/Monterrey";
const date = "2026-10-06"; // Tuesday
const weekly = [{ weekday: 2, startTime: "10:00", endTime: "14:00" }];
const now = DateTime.fromISO("2026-10-05T10:00", { zone });
const at = (time: string) => DateTime.fromISO(`${date}T${time}`, { zone }).toUTC().toJSDate();
const run = (options: Partial<Parameters<typeof calculateAvailableSlots>[0]> = {}) => calculateAvailableSlots({ date, durationMinutes: 60, slotIntervalMinutes: 30, weekly, exceptions: [], blocked: [], appointments: [], now, ...options });

describe("calculateAvailableSlots", () => {
  it("falls back to a safe interval for invalid settings instead of hanging", () => {
    for (const slotIntervalMinutes of [0, -30, Number.NaN, 0.5, 241]) expect(run({ slotIntervalMinutes })).toEqual(run());
  });
  it("returns slots on a normal open day", () => expect(run()).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"]));
  it("returns none on a closed day", () => expect(run({ date: "2026-10-05" })).toEqual([]));
  it("honors a closed date exception", () => expect(run({ exceptions: [{ type: "CLOSED", startTime: null, endTime: null }] })).toEqual([]));
  it("uses custom exception hours instead of weekly hours", () => expect(run({ exceptions: [{ type: "CUSTOM_HOURS", startTime: "12:00", endTime: "15:00" }] })).toEqual(["12:00", "12:30", "13:00", "13:30", "14:00"]));
  it("removes every slot that overlaps an appointment", () => expect(run({ appointments: [{ startAt: at("11:00"), endAt: at("12:00") }] })).toEqual(["10:00", "12:00", "12:30", "13:00"]));
  it("does not allow a service to extend past closing", () => expect(run({ durationMinutes: 90 })).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]));
  it("honors blocked periods", () => expect(run({ blocked: [{ startAt: at("12:00"), endAt: at("13:00") }] })).toEqual(["10:00", "10:30", "11:00", "13:00"]));
  it("allows back-to-back appointments", () => expect(run({ appointments: [{ startAt: at("11:00"), endAt: at("12:00") }] })).toContain("12:00"));
  it("ignores cancelled appointments", () => expect(run({ appointments: [{ startAt: at("11:00"), endAt: at("12:00"), status: "CANCELLED" }] })).toContain("11:00"));
  it("changes output for different service durations", () => expect(run({ durationMinutes: 180 })).toEqual(["10:00", "10:30", "11:00"]));
  it("ignores expired payment holds", () => expect(run({ appointments: [{ startAt: at("11:00"), endAt: at("12:00"), status: "PENDING", pendingExpiresAt: DateTime.fromISO("2026-10-05T09:00", { zone }).toJSDate() }] })).toContain("11:00"));
});
