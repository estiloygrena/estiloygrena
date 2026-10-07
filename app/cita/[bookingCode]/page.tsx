import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { db } from "@/lib/db";
import { formatMoney, formatSalonDate, formatSalonTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};
const paymentLabels = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  NOT_REQUIRED: "Pago en el local",
};

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ bookingCode: string }>;
}) {
  const { bookingCode } = await params;
  const settings = await getSettings();
  const appointment = await db.appointment
    .findUnique({
      where: { bookingCode },
      select: {
        bookingCode: true,
        customerName: true,
        serviceNameSnapshot: true,
        servicePricingTypeSnapshot: true,
        servicePriceSnapshot: true,
        serviceQuoteLabelSnapshot: true,
        serviceDurationSnapshot: true,
        startAt: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    })
    .catch(() => null);
  if (!appointment) notFound();
  const isQuote = appointment.servicePricingTypeSnapshot === "QUOTE";
  const priceDisplay = isQuote
    ? appointment.serviceQuoteLabelSnapshot || "Se cotiza por WhatsApp"
    : appointment.servicePriceSnapshot !== null
      ? formatMoney(appointment.servicePriceSnapshot)
      : "Precio pendiente";
  const message = isQuote
    ? `Hola, hice una cita para "${appointment.serviceNameSnapshot}".\n\nCódigo de cita: ${appointment.bookingCode}\nFecha: ${formatSalonDate(appointment.startAt)}\nHora: ${formatSalonTime(appointment.startAt)}\n\nQuisiera cotizar el servicio.`
    : `Hola, necesito ayuda con mi cita ${appointment.bookingCode} de Estilo y Greña.`;
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
  return (
    <PublicShell>
      <main className="min-h-[680px] px-5 py-16 sm:px-10">
        <p className="eyebrow text-white/50">
          Cita / {appointment.bookingCode}
        </p>
        <h1 className="display mt-4 text-6xl sm:text-8xl">
          {appointment.status === "CONFIRMED"
            ? "Nos vemos pronto."
            : "Estado de tu cita."}
        </h1>
        <p className="mt-6 text-xl">Hola, {appointment.customerName}.</p>
        <dl className="mt-10 grid border-t-2 border-white sm:grid-cols-2">
          {[
            ["Servicio", appointment.serviceNameSnapshot],
            ["Fecha", formatSalonDate(appointment.startAt)],
            ["Hora", `${formatSalonTime(appointment.startAt)} h`],
            ["Duración", `${appointment.serviceDurationSnapshot} min`],
            ["Precio", priceDisplay],
            [
              "Método",
              appointment.paymentMethod === "QUOTE"
                ? "Por definir"
                : appointment.paymentMethod === "CASH"
                  ? "Pago en el local"
                  : "Mercado Pago",
            ],
            ["Pago", isQuote ? "Cotización pendiente" : paymentLabels[appointment.paymentStatus]],
            ["Estado", statusLabels[appointment.status]],
          ].map(([label, value]) => (
            <div
              className="border-b border-white/40 py-5 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5"
              key={label}
            >
              <dt className="eyebrow text-white/45">{label}</dt>
              <dd className="mt-2 text-lg font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        {isQuote && (
          <div className="mt-8 border-2 border-white p-5">
            <span className="status-stamp">Servicio con cotización</span>
            <h2 className="mt-4 text-2xl font-black uppercase">{priceDisplay}</h2>
            <p className="mt-3 text-sm text-white/65">
              Tu horario está reservado. Escríbenos para confirmar el precio antes de tu cita.
            </p>
            <a className="btn btn-light mt-5" href={whatsappUrl} target="_blank" rel="noreferrer">
              Cotizar por WhatsApp ↗
            </a>
          </div>
        )}
        <div className="mt-10 border border-white/40 p-5">
          <p className="font-bold">¿Necesitas mover o cancelar?</p>
          <p className="mt-2 text-sm text-white/60">
            Escríbenos por WhatsApp e incluye tu código{" "}
            {appointment.bookingCode}.
          </p>
          <a
            className="btn mt-5"
            href={whatsappUrl}
          >
            Abrir WhatsApp ↗
          </a>
        </div>
      </main>
    </PublicShell>
  );
}
