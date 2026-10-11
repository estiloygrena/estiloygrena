import {
  createExceptionAction,
  deleteExceptionAction,
  replaceScheduleAction,
} from "@/app/admin/actions";
import { db } from "@/lib/db";
import { ScheduleEditor } from "@/components/schedule-editor";
import { SubmitButton } from "@/components/submit-button";

export default async function SchedulePage() {
  const [weekly, exceptions] = await Promise.all([
    db.weeklySchedule.findMany({
      orderBy: [{ weekday: "asc" }, { sortOrder: "asc" }],
    }),
    db.scheduleException.findMany({ orderBy: { date: "asc" }, take: 100 }),
  ]);
  return (
    <main className="p-5 sm:p-8">
      <p className="eyebrow">Horario semanal y excepciones</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">Horarios</h1>
      <form action={replaceScheduleAction} className="mt-8">
        <p className="mb-5 max-w-2xl text-sm text-black/60">
          Agrega uno o varios horarios por día. El tiempo entre ellos
          no estará disponible para citas.
        </p>
        <ScheduleEditor initial={weekly} />
        <SubmitButton className="btn mt-5 !border-black bg-black text-white" pendingText="Guardando horario…">
          Guardar horarios
        </SubmitButton>
      </form>
      <section className="mt-12">
        <p className="eyebrow opacity-50">Cambios para fechas específicas</p>
        <h2 className="display mt-2 text-4xl">Excepciones</h2>
        <form
          action={createExceptionAction}
          className="mt-4 grid gap-3 border-2 border-black bg-white p-5 sm:grid-cols-2 xl:grid-cols-5"
        >
          <label>
            <span className="label">Fecha</span>
            <input
              className="field !border-black !text-black"
              type="date"
              name="date"
              required
            />
          </label>
          <label>
            <span className="label">Tipo</span>
            <select className="field !border-black !text-black" name="type">
              <option value="CLOSED">Día cerrado</option>
              <option value="CUSTOM_HOURS">Horario especial</option>
            </select>
          </label>
          <label>
            <span className="label">Desde</span>
            <input
              className="field !border-black !text-black"
              type="time"
              name="startTime"
            />
          </label>
          <label>
            <span className="label">Hasta</span>
            <input
              className="field !border-black !text-black"
              type="time"
              name="endTime"
            />
          </label>
          <label>
            <span className="label">Motivo</span>
            <input className="field !border-black !text-black" name="label" />
          </label>
          <SubmitButton className="btn !border-black bg-black text-white sm:col-span-2 xl:col-span-5" pendingText="Agregando…">
            Agregar excepción
          </SubmitButton>
        </form>
        <div className="mt-5 border-t-2 border-black">
          {exceptions.map((item) => (
            <div
              className="flex flex-wrap items-center justify-between gap-4 border-b border-black/40 py-4"
              key={item.id}
            >
              <span>
                <b>{item.date.toISOString().slice(0, 10)}</b> ·{" "}
                {item.type === "CLOSED"
                  ? "Cerrado"
                  : `${item.startTime}–${item.endTime}`}{" "}
                {item.label && `· ${item.label}`}
              </span>
              <form action={deleteExceptionAction}>
                  <SubmitButton
                    className="btn !min-h-9 !border-black !px-3 !py-1 text-[10px]"
                    name="id"
                    value={item.id}
                    pendingText="…"
                  >
                    Eliminar
                  </SubmitButton>
              </form>
            </div>
          ))}
          {!exceptions.length && (
            <p className="border-b border-black/40 py-8 text-black/45">
              No hay excepciones programadas.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
