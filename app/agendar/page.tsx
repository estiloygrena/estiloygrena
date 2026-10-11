import { PublicShell } from "@/components/public-shell";
import { BookingWizard } from "@/components/booking-wizard";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Agenda tu cita",
  description: "Agenda tu cita en Estilo y Greña, peluquería en Guadalupe, Nuevo León. Selecciona un servicio, fecha y horario.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const settings = await getSettings();
  let services: Awaited<ReturnType<typeof db.service.findMany>> = [];
  if (process.env.DATABASE_URL)
    try {
      services = await db.service.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      });
    } catch {}
  return (
    <PublicShell>
      <main className="min-h-[720px] px-5 py-12 sm:px-10 sm:py-16">
        <BookingWizard
          initialServiceId={servicio}
          whatsappNumber={settings.whatsappNumber}
          services={services.map(
            ({
              id,
              name,
              description,
              pricingType,
              priceCents,
              quoteLabel,
              durationMinutes,
            }) => ({
              id,
              name,
              description,
              pricingType,
              priceCents,
              quoteLabel,
              durationMinutes,
            }),
          )}
        />
      </main>
    </PublicShell>
  );
}
