import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { calculateAvailableSlots } from "@/lib/availability";
import { createServiceSnapshot, resolveBookingPricing, type ServicePricingInput } from "@/lib/service-pricing";
import { serviceSchema } from "@/lib/validation";

const fixed: ServicePricingInput = { name: "Corte Alternativo", pricingType: "FIXED", priceCents: 35000, quoteLabel: null, durationMinutes: 60 };
const quote: ServicePricingInput = { name: "Color Fantasía", pricingType: "QUOTE", priceCents: null, quoteLabel: "Se cotiza por WhatsApp", durationMinutes: 180 };

describe("service pricing policy", () => {
  it("allows Mercado Pago for a valid fixed-price service", () => expect(resolveBookingPricing(fixed, "MERCADO_PAGO")).toMatchObject({ paymentMethod: "MERCADO_PAGO", amountCents: 35000, paymentStatus: "PENDING" }));
  it("allows payment at the salon for a fixed-price service", () => expect(resolveBookingPricing(fixed, "CASH")).toMatchObject({ paymentMethod: "CASH", amountCents: 35000, paymentStatus: "NOT_REQUIRED", appointmentStatus: "CONFIRMED" }));
  it("rejects Mercado Pago for a quote service", () => expect(() => resolveBookingPricing(quote, "MERCADO_PAGO")).toThrow("QUOTE_PAYMENT_METHOD_REQUIRED"));
  it("allows a quote appointment without payment", () => expect(resolveBookingPricing(quote, "QUOTE")).toMatchObject({ paymentMethod: "QUOTE", appointmentStatus: "CONFIRMED", paymentStatus: "NOT_REQUIRED" }));
  it("stores a null numeric price for a quote appointment", () => expect(resolveBookingPricing(quote, "QUOTE").servicePriceSnapshot).toBeNull());
  it("stores the quote label snapshot", () => expect(resolveBookingPricing(quote, "QUOTE").serviceQuoteLabelSnapshot).toBe("Se cotiza por WhatsApp"));
  it("does not change a fixed snapshot when the service price changes", () => { const editable = { ...fixed }; const snapshot = createServiceSnapshot(editable); editable.priceCents = 50000; expect(snapshot.servicePriceSnapshot).toBe(35000); });
  it("does not change a quote snapshot when the service label changes", () => { const editable = { ...quote }; const snapshot = createServiceSnapshot(editable); editable.quoteLabel = "Nueva cotización"; expect(snapshot.serviceQuoteLabelSnapshot).toBe("Se cotiza por WhatsApp"); });
  it("requires a positive price for fixed services", () => expect(serviceSchema.safeParse({ name: "Corte", description: "Descripción válida", pricingType: "FIXED", price: "", durationMinutes: 60, displayOrder: 0, isActive: true }).success).toBe(false));
  it("normalizes quote services without a numeric price", () => expect(serviceSchema.safeParse({ name: "Color", description: "Descripción válida", pricingType: "QUOTE", price: "", quoteLabel: "Precio sujeto a valoración", durationMinutes: 180, displayOrder: 0, isActive: true }).success).toBe(true));
  it("uses quote-service duration normally in availability", () => {
    const slots = calculateAvailableSlots({ date: "2026-10-06", durationMinutes: quote.durationMinutes, slotIntervalMinutes: 30, weekly: [{ weekday: 2, startTime: "10:00", endTime: "14:00" }], exceptions: [], blocked: [], appointments: [], now: DateTime.fromISO("2026-10-05T10:00", { zone: "America/Monterrey" }) });
    expect(slots).toEqual(["10:00", "10:30", "11:00"]);
  });
});
