"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DateTime } from "luxon";
import { useMemo, useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
import { DEFAULT_QUOTE_LABEL } from "@/lib/constants";

type Service = {
  id: string;
  name: string;
  description: string;
  pricingType: "FIXED" | "QUOTE";
  priceCents: number | null;
  quoteLabel: string | null;
  durationMinutes: number;
};
type FormState = {
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  email: string;
  instagram: string;
  notes: string;
  paymentMethod: "CASH" | "MERCADO_PAGO" | "QUOTE";
};
const initial: FormState = {
  serviceId: "",
  date: "",
  time: "",
  customerName: "",
  phone: "",
  email: "",
  instagram: "",
  notes: "",
  paymentMethod: "CASH",
};
const steps = [
  "Servicio",
  "Fecha",
  "Horario",
  "Tus datos",
  "Pago",
  "Confirmación",
];

export function BookingWizard({
  services,
  initialServiceId = "",
  whatsappNumber,
}: {
  services: Service[];
  initialServiceId?: string;
  whatsappNumber: string;
}) {
  const reduced = useReducedMotion();
  const initialService = services.find(
    (service) => service.id === initialServiceId,
  );
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    ...initial,
    serviceId: initialService?.id ?? "",
    paymentMethod: initialService?.pricingType === "QUOTE" ? "QUOTE" : "CASH",
  });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requestNumber = useRef(0);
  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId),
    [form.serviceId, services],
  );
  const minDate = DateTime.now().setZone("America/Monterrey").toISODate() ?? "";
  const maxDate =
    DateTime.now()
      .setZone("America/Monterrey")
      .plus({ months: 4 })
      .toISODate() ?? "";
  const priceLabel =
    selectedService?.pricingType === "QUOTE"
      ? selectedService.quoteLabel || DEFAULT_QUOTE_LABEL
      : selectedService?.priceCents !== null &&
          selectedService?.priceCents !== undefined
        ? formatMoney(selectedService.priceCents)
        : "—";
  const quoteMessage = selectedService
    ? `Hola, quiero cotizar el servicio "${selectedService.name}" en Estilo y Greña.`
    : "Hola, quiero cotizar un servicio en Estilo y Greña.";
  const quoteWhatsAppUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(quoteMessage)}`;

  async function loadSlots(serviceId: string, date: string) {
    const requestId = ++requestNumber.current;
    setSlots([]);
    setLoadingSlots(Boolean(serviceId && date));
    setError("");
    if (!serviceId || !date) return;
    try {
      const response = await fetch(
        `/api/availability?date=${date}&serviceId=${serviceId}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        slots?: string[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error);
      if (requestId === requestNumber.current) setSlots(data.slots ?? []);
    } catch (reason) {
      if (requestId === requestNumber.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "No pudimos consultar la agenda.",
        );
    } finally {
      if (requestId === requestNumber.current) setLoadingSlots(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }
  function chooseService(service: Service) {
    setForm((current) => ({
      ...current,
      serviceId: service.id,
      time: "",
      paymentMethod:
        service.pricingType === "QUOTE"
          ? "QUOTE"
          : current.paymentMethod === "MERCADO_PAGO"
            ? "MERCADO_PAGO"
            : "CASH",
    }));
    void loadSlots(service.id, form.date);
  }
  function chooseDate(date: string) {
    setForm((current) => ({ ...current, date, time: "" }));
    void loadSlots(form.serviceId, date);
  }
  function next() {
    if (step === 0 && !selectedService)
      return setError("Selecciona un servicio.");
    if (step === 1 && !form.date) return setError("Selecciona una fecha.");
    if (step === 2 && !form.time)
      return setError("Selecciona un horario disponible.");
    if (step === 3 && (!form.customerName.trim() || !form.phone.trim()))
      return setError("Ingresa tu nombre y teléfono.");
    setError("");
    setStep((value) => Math.min(5, value + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setError("");
    setStep((value) => Math.max(0, value - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        redirectUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.redirectUrl)
        throw new Error(result.error || "No pudimos crear la cita.");
      window.location.assign(result.redirectUrl);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No pudimos crear la cita.",
      );
      setSubmitting(false);
    }
  }
  const panel = {
    initial: reduced ? false : { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: reduced ? {} : { opacity: 0, x: -30 },
    transition: { duration: 0.25 },
  };

  if (!services.length)
    return (
      <section className="grid min-h-[540px] place-items-center border-2 border-white/40 p-6 text-center">
        <div>
          <p className="eyebrow text-white/45">Agenda temporalmente cerrada</p>
          <h1 className="display mt-4 text-5xl sm:text-7xl">
            Sin horarios
            <br />
            publicados.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-white/60">
            Todavía no hay servicios activos para reservar. Puedes volver al
            inicio o escribirnos desde la sección de contacto.
          </p>
          <Link className="btn mt-8" href="/#contacto">
            Ir a contacto →
          </Link>
        </div>
      </section>
    );

  return (
    <div>
      <ol
        className="mb-10 grid grid-cols-3 border border-white/40 sm:grid-cols-6"
        aria-label="Progreso de reserva"
      >
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`border-b border-r border-white/40 p-3 text-center text-[9px] font-black uppercase tracking-wider sm:border-b-0 sm:text-[10px] ${index === step ? "bg-white text-black" : index < step ? "text-white" : "text-white/35"}`}
          >
            <span className="hidden lg:inline">0{index + 1} / </span>
            {label}
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section key="service" {...panel}>
            <p className="eyebrow text-white/50">Paso 01 / Servicio</p>
            <h1 className="display mt-3 text-5xl sm:text-7xl">
              Elige tu corte.
            </h1>
            <div className="mt-8 grid gap-3">
              {services.map((service) => {
                const label =
                  service.pricingType === "QUOTE"
                    ? service.quoteLabel || DEFAULT_QUOTE_LABEL
                    : service.priceCents !== null
                      ? formatMoney(service.priceCents)
                      : "Precio no disponible";
                return (
                  <button
                    type="button"
                    key={service.id}
                    aria-pressed={form.serviceId === service.id}
                    onClick={() => chooseService(service)}
                    className={`grid gap-3 border-2 p-5 text-left transition sm:grid-cols-[1fr_auto] ${form.serviceId === service.id ? "border-white bg-white text-black" : "border-white/35 hover:border-white"}`}
                  >
                    <span>
                      <strong className="text-xl uppercase">
                        {service.name}
                      </strong>
                      <small
                        className={`mt-2 block ${form.serviceId === service.id ? "text-black/60" : "text-white/55"}`}
                      >
                        {service.description}
                      </small>
                    </span>
                    <span className="sm:text-right">
                      <b
                        className={`block ${service.pricingType === "QUOTE" ? "max-w-48 text-sm uppercase" : "text-xl"}`}
                      >
                        {label}
                      </b>
                      <small>{service.durationMinutes} min</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}
        {step === 1 && (
          <motion.section key="date" {...panel}>
            <p className="eyebrow text-white/50">Paso 02 / Fecha</p>
            <h1 className="display mt-3 text-5xl sm:text-7xl">Elige el día.</h1>
            <p className="mt-5 text-white/60">
              La disponibilidad depende de los{" "}
              {selectedService?.durationMinutes} minutos que requiere{" "}
              {selectedService?.name}.
            </p>
            <label className="mt-8 block">
              <span className="label">Fecha</span>
              <input
                className="field max-w-sm"
                type="date"
                min={minDate}
                max={maxDate}
                value={form.date}
                onChange={(event) => chooseDate(event.target.value)}
              />
            </label>
            {form.date && (
              <p className="mt-4 text-sm text-white/50">
                Seleccionaste{" "}
                {DateTime.fromISO(form.date)
                  .setLocale("es-MX")
                  .toFormat("cccc d 'de' LLLL")}
                .
              </p>
            )}
          </motion.section>
        )}
        {step === 2 && (
          <motion.section key="time" {...panel}>
            <p className="eyebrow text-white/50">Paso 03 / Horario</p>
            <h1 className="display mt-3 text-5xl sm:text-7xl">Toma tu hora.</h1>
            <div className="mt-8" aria-live="polite" aria-busy={loadingSlots}>
              {loadingSlots ? (
                <div className="border border-white/40 p-6 text-sm uppercase tracking-wider">
                  <div className="loading-bar mb-4" />
                  Consultando agenda…
                </div>
              ) : slots.length === 0 ? (
                <div className="border border-white/40 p-6 text-sm text-white/60">
                  <b className="mb-2 block text-white">
                    Ese día está lleno o cerrado.
                  </b>
                  Regresa y prueba otra fecha; los horarios cambian según la
                  duración del servicio.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => (
                    <button
                      aria-pressed={form.time === slot}
                      className={`border px-3 py-3 font-bold ${form.time === slot ? "bg-white text-black" : "border-white/40 hover:border-white"}`}
                      key={slot}
                      onClick={() => update("time", slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
        {step === 3 && (
          <motion.section key="details" {...panel}>
            <p className="eyebrow text-white/50">Paso 04 / Tus datos</p>
            <h1 className="display mt-3 text-5xl sm:text-7xl">¿Quién eres?</h1>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="label">Nombre *</span>
                <input
                  className="field"
                  autoComplete="name"
                  value={form.customerName}
                  onChange={(event) =>
                    update("customerName", event.target.value)
                  }
                />
              </label>
              <label>
                <span className="label">Teléfono *</span>
                <input
                  className="field"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
              </label>
              <label>
                <span className="label">Correo</span>
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </label>
              <label>
                <span className="label">Instagram</span>
                <input
                  className="field"
                  placeholder="@usuario"
                  value={form.instagram}
                  onChange={(event) => update("instagram", event.target.value)}
                />
              </label>
              <label className="sm:col-span-2">
                <span className="label">Notas</span>
                <textarea
                  className="field min-h-28"
                  placeholder="Cuéntanos sobre tu pelo, referencias o accesibilidad."
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                />
              </label>
            </div>
          </motion.section>
        )}
        {step === 4 && (
          <motion.section key="payment" {...panel}>
            <p className="eyebrow text-white/50">Paso 05 / Forma de pago</p>
            <h1 className="display mt-3 text-5xl sm:text-7xl">
              ¿Cómo quieres pagar?
            </h1>
            {selectedService?.pricingType === "QUOTE" ? (
              <div className="mt-8 border-2 border-white p-6">
                <span className="status-stamp">Servicio con cotización</span>
                <h2 className="mt-5 text-2xl font-black uppercase">
                  {priceLabel}
                </h2>
                <p className="mt-3 max-w-xl text-white/65">
                  Puedes reservar tu horario ahora. Nos pondremos en contacto
                  contigo para confirmar el precio; este servicio no genera
                  cobro en línea.
                </p>
                <a
                  className="btn mt-6"
                  href={quoteWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cotizar por WhatsApp ↗
                </a>
              </div>
            ) : (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  aria-pressed={form.paymentMethod === "MERCADO_PAGO"}
                  className={`border-2 p-5 text-left ${form.paymentMethod === "MERCADO_PAGO" ? "bg-white text-black" : "border-white/40"}`}
                  onClick={() => update("paymentMethod", "MERCADO_PAGO")}
                >
                  <b className="block uppercase">Pagar en línea</b>
                  <small className="mt-2 block opacity-60">Mercado Pago</small>
                </button>
                <button
                  aria-pressed={form.paymentMethod === "CASH"}
                  className={`border-2 p-5 text-left ${form.paymentMethod === "CASH" ? "bg-white text-black" : "border-white/40"}`}
                  onClick={() => update("paymentMethod", "CASH")}
                >
                  <b className="block uppercase">Pagar en el local</b>
                  <small className="mt-2 block opacity-60">
                    Efectivo / pago presencial
                  </small>
                </button>
              </div>
            )}
          </motion.section>
        )}
        {step === 5 && (
          <motion.section key="confirm" {...panel}>
            <p className="eyebrow text-white/50">Paso 06 / Confirmación</p>
            <h1 className="display mt-3 text-5xl sm:text-7xl">
              Revisa el corte.
            </h1>
            <dl className="mt-8 grid grid-cols-2 border-y border-white/40 py-5 text-sm">
              <dt className="text-white/50">Servicio</dt>
              <dd className="text-right font-bold">{selectedService?.name}</dd>
              <dt className="mt-3 text-white/50">Fecha</dt>
              <dd className="mt-3 text-right">
                {form.date
                  ? DateTime.fromISO(form.date)
                      .setLocale("es-MX")
                      .toFormat("d 'de' LLLL, yyyy")
                  : "—"}
              </dd>
              <dt className="mt-3 text-white/50">Hora</dt>
              <dd className="mt-3 text-right">{form.time} h</dd>
              <dt className="mt-3 text-white/50">Duración</dt>
              <dd className="mt-3 text-right">
                {selectedService?.durationMinutes} min
              </dd>
              <dt className="mt-3 text-white/50">Precio</dt>
              <dd className="mt-3 text-right text-lg font-black">
                {priceLabel}
              </dd>
              <dt className="mt-3 text-white/50">Pago</dt>
              <dd className="mt-3 text-right">
                {selectedService?.pricingType === "QUOTE"
                  ? "Por definir"
                  : form.paymentMethod === "CASH"
                    ? "En el local"
                    : "Mercado Pago"}
              </dd>
            </dl>
            {selectedService?.pricingType === "QUOTE" && (
              <p className="mt-5 border border-white/40 p-4 text-sm text-white/65">
                El precio se confirmará por WhatsApp. Al reservar no se
                realizará ningún cobro.
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>
      {error && (
        <p
          className="mt-6 border-2 border-white bg-white p-4 font-bold text-black"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="mt-8 flex justify-between gap-3">
        {step > 0 ? (
          <button className="btn" onClick={back}>
            ← Atrás
          </button>
        ) : (
          <span />
        )}
        {step < 5 ? (
          <button className="btn btn-light" onClick={next}>
            Continuar →
          </button>
        ) : (
          <button
            className="btn btn-light"
            disabled={submitting}
            onClick={submit}
          >
            {submitting
              ? "Reservando…"
              : selectedService?.pricingType === "QUOTE"
                ? "Reservar horario"
                : form.paymentMethod === "CASH"
                  ? "Confirmar cita"
                  : "Confirmar e ir a pagar"}
          </button>
        )}
      </div>
    </div>
  );
}
