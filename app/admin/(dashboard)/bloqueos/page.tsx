import { createBlockAction, deleteBlockAction } from "@/app/admin/actions";
import { db } from "@/lib/db";
import { formatSalonDate, formatSalonTime } from "@/lib/format";
import { SubmitButton } from "@/components/submit-button";

export default async function BlocksPage() {
  const blocks = await db.blockedPeriod.findMany({
    where: { endAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
  });
  return (
    <main className="p-5 sm:p-8">
      <p className="eyebrow">Vacaciones / Tiempo personal</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">Bloqueos.</h1>
      <form
        action={createBlockAction}
        className="mt-8 grid gap-4 border-2 border-black bg-white p-5 sm:grid-cols-3"
      >
        <label>
          <span className="label">Inicio</span>
          <input
            className="field !border-black !text-black"
            type="datetime-local"
            name="startAt"
            required
          />
        </label>
        <label>
          <span className="label">Fin</span>
          <input
            className="field !border-black !text-black"
            type="datetime-local"
            name="endAt"
            required
          />
        </label>
        <label>
          <span className="label">Motivo</span>
          <input className="field !border-black !text-black" name="reason" />
        </label>
        <SubmitButton className="btn !border-black bg-black text-white sm:col-span-3" pendingText="Bloqueando…">
          Bloquear periodo
        </SubmitButton>
      </form>
      <div className="mt-8 border-t-2 border-black">
        {blocks.map((block) => (
          <div
            className="flex items-center justify-between gap-4 border-b border-black/40 py-5"
            key={block.id}
          >
            <div>
              <b>{formatSalonDate(block.startAt)}</b>
              <p>
                {formatSalonTime(block.startAt)} →{" "}
                {formatSalonDate(block.endAt)} {formatSalonTime(block.endAt)}
              </p>
              <small>{block.reason}</small>
            </div>
            <form action={deleteBlockAction}>
              <SubmitButton className="underline" name="id" value={block.id} pendingText="Eliminando…">
                Eliminar
              </SubmitButton>
            </form>
          </div>
        ))}
        {!blocks.length && (
          <p className="py-8 opacity-50">No hay bloqueos futuros.</p>
        )}
      </div>
    </main>
  );
}
