import "../scripts/load-env";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  const services = [
    {
      name: "Corte Alternativo",
      slug: "corte-alternativo",
      description: "Corte alternativo según el estilo que buscas.",
      pricingType: "FIXED" as const,
      priceCents: 35000,
      quoteLabel: null,
      durationMinutes: 60,
    },
    {
      name: "Corte + Diseño",
      slug: "corte-diseno",
      description: "Corte con líneas o detalles de diseño.",
      pricingType: "FIXED" as const,
      priceCents: 45000,
      quoteLabel: null,
      durationMinutes: 90,
    },
    {
      name: "Fleco",
      slug: "fleco",
      description: "Corte o ajuste de fleco.",
      pricingType: "FIXED" as const,
      priceCents: 18000,
      quoteLabel: null,
      durationMinutes: 30,
    },
    {
      name: "Color Fantasía",
      slug: "color-fantasia",
      description: "Color fantasía. Se cotiza según el largo, la base y la técnica.",
      pricingType: "QUOTE" as const,
      priceCents: null,
      quoteLabel: "Se cotiza por WhatsApp",
      durationMinutes: 180,
    },
    {
      name: "Corrección de Color",
      slug: "correccion-color",
      description:
        "Corrección de color con valoración previa.",
      pricingType: "QUOTE" as const,
      priceCents: null,
      quoteLabel: "Precio sujeto a valoración",
      durationMinutes: 240,
    },
  ];

  for (const [displayOrder, service] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, displayOrder },
    });
  }

  if ((await prisma.weeklySchedule.count()) === 0) {
    await prisma.weeklySchedule.createMany({
      data: [2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        startTime: "11:00",
        endTime: "20:00",
      })),
    });
  }

  const settings = DEFAULT_SETTINGS;
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
}

main().then(() => console.log("Semilla completada; se conservaron los registros existentes.")).catch(() => { console.error("No se pudo completar la semilla. Verifica conexión y migraciones."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
