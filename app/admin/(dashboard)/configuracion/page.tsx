import { saveSettingsAction } from "@/app/admin/actions";
import { getSettings } from "@/lib/settings";
import { SubmitButton } from "@/components/submit-button";

export default async function SettingsPage() {
  const settings = await getSettings();
  const fields = [
    ["salonName", "Nombre del salón"],
    ["tagline", "Frase"],
    ["address", "Dirección"],
    ["instagramUrl", "Instagram URL"],
    ["whatsappNumber", "WhatsApp (con lada)"],
    ["googleMapsUrl", "Google Maps URL"],
    ["slotIntervalMinutes", "Intervalo de citas / min"],
  ] as const;
  return (
    <main className="p-5 sm:p-8">
      <p className="eyebrow">Información pública</p>
      <h1 className="display mt-2 text-5xl sm:text-7xl">Configuración.</h1>
      <form
        action={saveSettingsAction}
        className="mt-8 grid gap-5 border-2 border-black bg-white p-5 sm:grid-cols-2"
      >
        {fields.map(([name, label]) => (
          <label key={name}>
            <span className="label">{label}</span>
            <input
              className="field !border-black !text-black"
              name={name}
              defaultValue={settings[name]}
              required
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="label">Política de cancelación</span>
          <textarea
            className="field min-h-32 !border-black !text-black"
            name="cancellationPolicy"
            defaultValue={settings.cancellationPolicy}
            required
          />
        </label>
        <SubmitButton className="btn !border-black bg-black text-white sm:col-span-2" pendingText="Guardando configuración…">
          Guardar configuración
        </SubmitButton>
      </form>
    </main>
  );
}
