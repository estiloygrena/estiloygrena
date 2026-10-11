import { db } from "@/lib/db";
import { formatMoney, formatSalonDate, formatSalonTime } from "@/lib/format";
import {
  rescheduleAppointmentAction,
  updateAppointmentAction,
} from "@/app/admin/actions";
import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { SALON_TIMEZONE } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
} as const;
const paymentLabels = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "No completado",
  REFUNDED: "Reembolsado",
  NOT_REQUIRED: "En el local",
} as const;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    paymentStatus?: string;
    service?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const query = await searchParams;
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ] as const;
  const status = validStatuses.find((item) => item === query.status);
  const paymentMethod = (["CASH", "MERCADO_PAGO", "QUOTE"] as const).find(
    (item) => item === query.payment,
  );
  const paymentStatus = (
    ["PENDING", "PAID", "FAILED", "REFUNDED", "NOT_REQUIRED"] as const
  ).find((item) => item === query.paymentStatus);
  const startAt: Prisma.DateTimeFilter = {};
  if (query.from)
    startAt.gte = DateTime.fromISO(query.from, { zone: SALON_TIMEZONE })
      .startOf("day")
      .toUTC()
      .toJSDate();
  if (query.to)
    startAt.lte = DateTime.fromISO(query.to, { zone: SALON_TIMEZONE })
      .endOf("day")
      .toUTC()
      .toJSDate();
  const where: Prisma.AppointmentWhereInput = {
    status,
    paymentMethod,
    paymentStatus,
    serviceId: query.service || undefined,
    startAt: Object.keys(startAt).length ? startAt : undefined,
  };
  const [appointments, services] = await Promise.all([
    db.appointment.findMany({ where, orderBy: { startAt: "desc" }, take: 100 }),
    db.service.findMany({
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <main className="p-5 sm:p-8">
      <p className="eyebrow">Administrar citas</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">Citas</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {["Todas", ...validStatuses].map((item) => (
          <a
            key={item}
            className={`border border-black px-3 py-2 text-xs font-black uppercase ${(!status && item === "Todas") || status === item ? "bg-black text-white" : ""}`}
            href={
              item === "Todas" ? "/admin/citas" : `/admin/citas?status=${item}`
            }
          >
            {item === "Todas"
              ? item
              : statusLabels[item as keyof typeof statusLabels]}
          </a>
        ))}
      </div>
      <form className="mt-4 grid gap-2 border-2 border-black bg-white p-3 sm:grid-cols-2 xl:grid-cols-6">
        <input type="hidden" name="status" value={status ?? ""} />
        <input
          className="min-h-10 border border-black px-2"
          type="date"
          name="from"
          defaultValue={query.from}
          aria-label="Desde"
        />
        <input
          className="min-h-10 border border-black px-2"
          type="date"
          name="to"
          defaultValue={query.to}
          aria-label="Hasta"
        />
        <select
          className="min-h-10 border border-black px-2"
          name="service"
          defaultValue={query.service ?? ""}
          aria-label="Servicio"
        >
          <option value="">Todos los servicios</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <select
          className="min-h-10 border border-black px-2"
          name="payment"
          defaultValue={paymentMethod ?? ""}
          aria-label="Método de pago"
        >
          <option value="">Cualquier método</option>
          <option value="CASH">Pago en el local</option>
          <option value="MERCADO_PAGO">Mercado Pago</option>
          <option value="QUOTE">Por definir</option>
        </select>
        <select
          className="min-h-10 border border-black px-2"
          name="paymentStatus"
          defaultValue={paymentStatus ?? ""}
          aria-label="Estado de pago"
        >
          <option value="">Cualquier pago</option>
          <option value="PENDING">Pendiente</option>
          <option value="PAID">Pagado</option>
          <option value="FAILED">No completado</option>
          <option value="REFUNDED">Reembolsado</option>
          <option value="NOT_REQUIRED">No requerido</option>
        </select>
        <button className="btn !min-h-10 !border-black bg-black !py-1 text-white">
          Filtrar
        </button>
      </form>
      <div className="mt-8 grid gap-5">
        {appointments.map((appointment) => (
          <article
            className="border-2 border-black bg-white p-5"
            key={appointment.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="eyebrow opacity-50">
                    {appointment.bookingCode}
                  </p>
                  <span className="status-stamp">
                    {statusLabels[appointment.status]}
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black uppercase">
                  {appointment.customerName}
                </h2>
                <p>
                  {appointment.serviceNameSnapshot} ·{" "}
                  {appointment.servicePricingTypeSnapshot === "QUOTE"
                    ? appointment.serviceQuoteLabelSnapshot || "Se cotiza por WhatsApp"
                    : appointment.servicePriceSnapshot !== null
                      ? formatMoney(appointment.servicePriceSnapshot)
                      : "Precio pendiente"}
                </p>
              </div>
              <div className="text-right">
                <b>{formatSalonDate(appointment.startAt)}</b>
                <p className="text-xl">
                  {formatSalonTime(appointment.startAt)} ·{" "}
                  {appointment.serviceDurationSnapshot} min
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 border-y border-black/30 py-4 text-sm sm:grid-cols-3">
              <a className="underline" href={`tel:${appointment.phone}`}>
                {appointment.phone}
              </a>
              <span>{appointment.email ?? "Sin correo"}</span>
              <span>
                {appointment.paymentMethod === "QUOTE"
                  ? "Por definir"
                  : appointment.paymentMethod === "CASH"
                    ? "Pago en el local"
                    : "Mercado Pago"}{" "}
                / {appointment.servicePricingTypeSnapshot === "QUOTE"
                  ? "Cotización pendiente"
                  : paymentLabels[appointment.paymentStatus]}
              </span>
            </div>
            {appointment.notes && (
              <p className="mt-4 text-sm">Notas: {appointment.notes}</p>
            )}
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <form
                action={updateAppointmentAction}
                className="flex flex-wrap gap-2"
              >
                <input type="hidden" name="id" value={appointment.id} />
                <input
                  className="min-h-11 flex-1 border border-black px-3"
                  name="notes"
                  defaultValue={appointment.notes ?? ""}
                  placeholder="Notas"
                />
                <select
                  className="min-h-11 border border-black bg-white px-3"
                  name="status"
                  defaultValue={appointment.status}
                >
                  {validStatuses.map((item) => (
                    <option key={item} value={item}>
                      {statusLabels[item]}
                    </option>
                  ))}
                </select>
                <SubmitButton className="btn !min-h-11 !border-black bg-black !py-2 text-white" pendingText="Guardando…">
                  Guardar estado
                </SubmitButton>
              </form>
              <form
                action={rescheduleAppointmentAction}
                className="flex flex-wrap justify-start gap-2 lg:justify-end"
              >
                <input type="hidden" name="id" value={appointment.id} />
                <input
                  className="min-h-11 border border-black px-2"
                  type="date"
                  name="date"
                  required
                />
                <input
                  className="min-h-11 border border-black px-2"
                  type="time"
                  name="time"
                  step="1800"
                  required
                />
                <SubmitButton className="btn !min-h-11 !border-black !py-2" pendingText="Reagendando…">
                  Reagendar
                </SubmitButton>
              </form>
            </div>
          </article>
        ))}
        {appointments.length === 0 && (
          <p className="border-2 border-black p-8">
            No hay citas con este filtro.
          </p>
        )}
      </div>
    </main>
  );
}
