import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(8, "Ingresa un teléfono válido.")
  .max(20, "El teléfono no puede tener más de 20 caracteres.")
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
  customerName: z.string().trim().min(2, "Ingresa tu nombre.").max(100, "El nombre no puede tener más de 100 caracteres."),
  phone,
  email: z
    .union([z.literal(""), z.email("Ingresa un correo válido.")])
    .optional(),
  instagram: z.string().trim().max(60, "El usuario de Instagram no puede tener más de 60 caracteres.").optional(),
  notes: z.string().trim().max(800, "Las notas no pueden tener más de 800 caracteres.").optional(),
  paymentMethod: z.enum(["CASH", "MERCADO_PAGO", "QUOTE"]),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const serviceSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "El nombre del servicio debe tener al menos 2 caracteres.").max(100, "El nombre del servicio no puede tener más de 100 caracteres."),
    description: z.string().trim().min(5, "La descripción debe tener al menos 5 caracteres.").max(600, "La descripción no puede tener más de 600 caracteres."),
    pricingType: z.enum(["FIXED", "QUOTE"]),
    price: z
      .union([
        z.literal(""),
        z.coerce.number().positive("El precio debe ser mayor a cero."),
      ])
      .optional(),
    quoteLabel: z.string().trim().max(120, "El texto de cotización no puede tener más de 120 caracteres.").optional(),
    durationMinutes: z.coerce.number().int("Ingresa la duración en minutos enteros.").min(15, "La duración mínima es de 15 minutos.").max(720, "La duración máxima es de 720 minutos."),
    displayOrder: z.coerce.number().int("El orden debe ser un número entero.").min(0, "El orden no puede ser negativo.").default(0),
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
