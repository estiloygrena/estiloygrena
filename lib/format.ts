import { DateTime } from "luxon";
import { SALON_TIMEZONE } from "@/lib/constants";

export const formatMoney = (cents: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(cents / 100);
export const formatSalonDate = (date: Date | string) => DateTime.fromJSDate(typeof date === "string" ? new Date(date) : date).setZone(SALON_TIMEZONE).setLocale("es-MX").toFormat("cccc d 'de' LLLL, yyyy");
export const formatSalonTime = (date: Date | string) => DateTime.fromJSDate(typeof date === "string" ? new Date(date) : date).setZone(SALON_TIMEZONE).toFormat("HH:mm");
export const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
