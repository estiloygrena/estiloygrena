import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(8, "Ingresa un teléfono válido.")
  .max(20)
  .transform((value) => {
    const normalized = value.replace(/[^\d+]/g, "");
    return normalized.startsWith("+")
      ? normalized
      : `+52${normalized.replace(/^52/, "")}`;
  });

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona un horario disponible."),
  customerName: z.string().trim().min(2, "Ingresa tu nombre.").max(100),
  phone,
  email: z
    .union([z.literal(""), z.email("Ingresa un correo válido.")])
    .optional(),
  instagram: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(800).optional(),
  paymentMethod: z.enum(["CASH", "MERCADO_PAGO", "QUOTE"]),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const serviceSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().min(5).max(600),
    pricingType: z.enum(["FIXED", "QUOTE"]),
    price: z
      .union([
        z.literal(""),
        z.coerce.number().positive("El precio debe ser mayor a cero."),
      ])
      .optional(),
    quoteLabel: z.string().trim().max(120).optional(),
    durationMinutes: z.coerce.number().int().min(15).max(720),
    displayOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.coerce.boolean().default(true),
  })
  .superRefine((value, context) => {
    if (
      value.pricingType === "FIXED" &&
      (value.price === "" || value.price === undefined)
    )
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "Ingresa un precio fijo válido.",
      });
  });
