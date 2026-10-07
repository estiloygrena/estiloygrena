import type { PaymentMethod, ServicePricingType } from "@prisma/client";
import { DEFAULT_QUOTE_LABEL } from "@/lib/constants";

export type ServicePricingInput = {
  name: string;
  pricingType: ServicePricingType;
  priceCents: number | null;
  quoteLabel: string | null;
  durationMinutes: number;
};

export function servicePriceLabel(
  service: Pick<
    ServicePricingInput,
    "pricingType" | "priceCents" | "quoteLabel"
  >,
  formatMoney: (cents: number) => string,
) {
  return service.pricingType === "QUOTE"
    ? service.quoteLabel?.trim() || DEFAULT_QUOTE_LABEL
    : service.priceCents !== null
      ? formatMoney(service.priceCents)
      : "Precio no disponible";
}

export function resolveBookingPricing(
  service: ServicePricingInput,
  requestedPaymentMethod: PaymentMethod,
) {
  if (service.pricingType === "QUOTE") {
    if (requestedPaymentMethod !== "QUOTE")
      throw new Error("QUOTE_PAYMENT_METHOD_REQUIRED");
    return {
      paymentMethod: "QUOTE" as const,
      paymentStatus: "NOT_REQUIRED" as const,
      appointmentStatus: "CONFIRMED" as const,
      amountCents: null,
      servicePricingTypeSnapshot: "QUOTE" as const,
      servicePriceSnapshot: null,
      serviceQuoteLabelSnapshot:
        service.quoteLabel?.trim() || DEFAULT_QUOTE_LABEL,
    };
  }
  if (service.priceCents === null || service.priceCents <= 0)
    throw new Error("FIXED_PRICE_REQUIRED");
  if (requestedPaymentMethod === "QUOTE")
    throw new Error("FIXED_PAYMENT_METHOD_REQUIRED");
  return {
    paymentMethod: requestedPaymentMethod,
    paymentStatus:
      requestedPaymentMethod === "CASH"
        ? ("NOT_REQUIRED" as const)
        : ("PENDING" as const),
    appointmentStatus:
      requestedPaymentMethod === "CASH"
        ? ("CONFIRMED" as const)
        : ("PENDING" as const),
    amountCents: service.priceCents,
    servicePricingTypeSnapshot: "FIXED" as const,
    servicePriceSnapshot: service.priceCents,
    serviceQuoteLabelSnapshot: null,
  };
}

export function createServiceSnapshot(service: ServicePricingInput) {
  return {
    serviceNameSnapshot: service.name,
    serviceDurationSnapshot: service.durationMinutes,
    servicePricingTypeSnapshot: service.pricingType,
    servicePriceSnapshot:
      service.pricingType === "FIXED" ? service.priceCents : null,
    serviceQuoteLabelSnapshot:
      service.pricingType === "QUOTE"
        ? service.quoteLabel?.trim() || DEFAULT_QUOTE_LABEL
        : null,
  };
}
