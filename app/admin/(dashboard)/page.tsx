import Link from "next/link";
import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { SALON_TIMEZONE } from "@/lib/constants";
import { formatMoney, formatSalonTime } from "@/lib/format";

const statusLabels = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
} as const;

export default async function Dashboard() {
  const now = DateTime.now().setZone(SALON_TIMEZONE); const todayStart = now.startOf("day").toUTC().toJSDate(); const todayEnd = now.endOf("day").toUTC().toJSDate(); const weekEnd = now.endOf("week").toUTC().toJSDate();
  const [today, week, upcoming, paid, cash, cancelled, schedule] = await Promise.all([
    db.appointment.count({ where: { startAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } } }),
    db.appointment.count({ where: { startAt: { gte: todayStart, lte: weekEnd }, status: { not: "CANCELLED" } } }),
    db.appointment.count({ where: { startAt: { gt: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } } }),
    db.appointment.aggregate({ where: { paymentStatus: "PAID" }, _sum: { amountCents: true } }),
    db.appointment.count({ where: { paymentMethod: "CASH", startAt: { gte: todayStart, lte: weekEnd } } }),
    db.appointment.count({ where: { status: "CANCELLED", createdAt: { gte: now.startOf("month").toJSDate() } } }),
    db.appointment.findMany({ where: { startAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } }, orderBy: { startAt: "asc" } }),
  ]);
  const stats = [["Citas hoy", today], ["Resto de la semana", week], ["Próximas citas", upcoming], ["Total pagado", formatMoney(paid._sum.amountCents ?? 0)], ["Pago en el local / semana", cash], ["Canceladas / mes", cancelled]];
  return <main className="p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Administración</p><h1 className="display mt-2 text-5xl sm:text-7xl">Resumen</h1></div><Link className="btn !border-black bg-black text-white" href="/admin/citas">Ver citas →</Link></div><section className="mt-8 grid border-l border-t border-black sm:grid-cols-2 xl:grid-cols-3">{stats.map(([label, value]) => <div className="border-b border-r border-black p-5" key={label}><p className="eyebrow opacity-55">{label}</p><p className="mt-3 text-4xl font-black">{value}</p></div>)}</section><section className="mt-12"><h2 className="display text-4xl">Citas de hoy</h2><div className="mt-5 border-t-2 border-black">{schedule.length ? schedule.map((appointment) => <div className="grid grid-cols-[70px_1fr] gap-4 border-b border-black/40 py-4 sm:grid-cols-[70px_1fr_1fr_auto]" key={appointment.id}><b>{formatSalonTime(appointment.startAt)}</b><span>{appointment.customerName}</span><span>{appointment.serviceNameSnapshot}</span><span className="eyebrow">{statusLabels[appointment.status]}</span></div>) : <p className="border-b border-black/40 py-8 text-black/55">No hay citas para hoy.</p>}</div></section></main>;
}
