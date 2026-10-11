import { archiveServiceAction, saveServiceAction } from "@/app/admin/actions";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { SubmitButton } from "@/components/submit-button";
import { ServicePricingFields } from "@/components/service-pricing-fields";

function ServiceForm({
  service,
}: {
  service?: Awaited<ReturnType<typeof db.service.findMany>>[number];
}) {
  return (
    <form
      action={saveServiceAction}
      className={service ? "bg-white p-2" : "border-2 border-black bg-white p-5"}
    >
      <input type="hidden" name="id" value={service?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Nombre</span>
          <input
            className="field !border-black !text-black"
            name="name"
            defaultValue={service?.name}
            required
          />
        </label>
        <ServicePricingFields initialType={service?.pricingType ?? "FIXED"} priceCents={service?.priceCents} quoteLabel={service?.quoteLabel} />
        <label>
          <span className="label">Duración / min</span>
          <input
            className="field !border-black !text-black"
            name="durationMinutes"
            type="number"
            min="15"
            step="15"
            defaultValue={service?.durationMinutes ?? 60}
            required
          />
        </label>
        <label>
          <span className="label">Orden</span>
          <input
            className="field !border-black !text-black"
            name="displayOrder"
            type="number"
            min="0"
            defaultValue={service?.displayOrder ?? 0}
            required
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Descripción</span>
          <textarea
            className="field min-h-24 !border-black !text-black"
            name="description"
            defaultValue={service?.description}
            required
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Imagen opcional</span>
          <input
            className="field !border-black !text-black"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
          <small className="mt-2 block text-black/50">JPG, PNG, WebP o AVIF. Máximo 10 MB.</small>
        </label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={service?.isActive ?? true}
        />{" "}
        Disponible para reservar
      </label>
      {service?.imageKey && (
        <label className="mt-3 flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="removeImage" /> Quitar imagen actual
        </label>
      )}
      <div className="mt-5 flex gap-2">
        <SubmitButton className="btn !border-black bg-black text-white" pendingText="Guardando…">
          {service ? "Guardar cambios" : "Crear servicio"}
        </SubmitButton>
        {service && (
          <SubmitButton
            formAction={archiveServiceAction}
            className="btn !border-black"
            name="id"
            value={service.id}
            pendingText="Archivando…"
          >
            Archivar
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

export default async function ServicesPage() {
  const services = await db.service.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return (
    <main className="p-5 sm:p-8">
      <p className="eyebrow">Administrar servicios</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">Servicios</h1>
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-black uppercase">Nuevo servicio</h2>
        <ServiceForm />
      </section>
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-black uppercase">
          Servicios actuales
        </h2>
        <div className="grid gap-5">
          {services.map((service) => (
            <details
              className="group border-2 border-black bg-white"
              key={service.id}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 hover:bg-black hover:text-white">
                <span>
                  <b className="block text-lg uppercase">{service.name}</b>
                  <small className="eyebrow opacity-55">
                    {service.durationMinutes} min / {service.pricingType === "QUOTE" ? service.quoteLabel || "Se cotiza por WhatsApp" : service.priceCents !== null ? formatMoney(service.priceCents) : "Precio pendiente"}
                  </small>
                </span>
                <span className="status-stamp">
                  {service.isActive ? "Activo" : "Archivado"}
                </span>
              </summary>
              <div className="border-t-2 border-black p-3">
                <ServiceForm service={service} />
              </div>
            </details>
          ))}
          {!services.length && (
            <p className="border-2 border-black p-8 text-black/50">
              No hay servicios registrados. Agrega uno con el formulario.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
