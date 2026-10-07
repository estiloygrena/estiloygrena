import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const services = [
    {
      name: "Corte Alternativo",
      slug: "corte-alternativo",
      description: "Forma, textura y una silueta hecha para ti.",
      pricingType: "FIXED" as const,
      priceCents: 35000,
      quoteLabel: null,
      durationMinutes: 60,
    },
    {
      name: "Corte + Diseño",
      slug: "corte-diseno",
      description: "Corte con diseño gráfico, líneas o detalle creativo.",
      pricingType: "FIXED" as const,
      priceCents: 45000,
      quoteLabel: null,
      durationMinutes: 90,
    },
    {
      name: "Fleco",
      slug: "fleco",
      description: "Ajuste o transformación de fleco.",
      pricingType: "FIXED" as const,
      priceCents: 18000,
      quoteLabel: null,
      durationMinutes: 30,
    },
    {
      name: "Color Fantasía",
      slug: "color-fantasia",
      description: "Color creativo personalizado según largo, base y técnica.",
      pricingType: "QUOTE" as const,
      priceCents: null,
      quoteLabel: "Se cotiza por WhatsApp",
      durationMinutes: 180,
    },
    {
      name: "Corrección de Color",
      slug: "correccion-color",
      description:
        "Diagnóstico y corrección técnica de color previa valoración.",
      pricingType: "QUOTE" as const,
      priceCents: null,
      quoteLabel: "Precio sujeto a valoración",
      durationMinutes: 240,
    },
  ];

  for (const [displayOrder, service] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        pricingType: service.pricingType,
        priceCents: service.priceCents,
        quoteLabel: service.quoteLabel,
      },
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

  const settings = {
    salonName: "Estilo y Greña",
    tagline: "Cortes sin molde.",
    address:
      "Gral. Plutarco Elías Calles 3216, Riberas del Río, 67160 Guadalupe, N.L., México",
    instagramUrl: "https://instagram.com/estiloygrena",
    whatsappNumber: "528100000000",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Estilo%20y%20Gre%C3%B1a%2C%20Gral.%20Plutarco%20El%C3%ADas%20Calles%203216%2C%20Riberas%20del%20R%C3%ADo%2C%2067160%20Guadalupe%2C%20N.L.%2C%20M%C3%A9xico",
    slotIntervalMinutes: "30",
    cancellationPolicy:
      "Avísanos con al menos 24 horas de anticipación para mover o cancelar tu cita.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: ["address", "googleMapsUrl"].includes(key) ? { value } : {},
      create: { key, value },
    });
  }
}

main().finally(() => prisma.$disconnect());
