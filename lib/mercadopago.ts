import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function client() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN no está configurado.");
  return new MercadoPagoConfig({ accessToken });
}

export async function createPaymentPreference(input: { appointmentId: string; bookingCode: string; serviceName: string; amountCents: number; customerEmail?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new Preference(client()).create({ body: {
    items: [{ id: input.appointmentId, title: input.serviceName, quantity: 1, currency_id: "MXN", unit_price: input.amountCents / 100 }],
    payer: input.customerEmail ? { email: input.customerEmail } : undefined,
    external_reference: input.appointmentId,
    back_urls: { success: `${baseUrl}/pago/exito?cita=${input.bookingCode}`, pending: `${baseUrl}/pago/pendiente?cita=${input.bookingCode}`, failure: `${baseUrl}/pago/error?cita=${input.bookingCode}` },
    auto_return: "approved",
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    expires: true,
    expiration_date_to: new Date(Date.now() + 15 * 60_000).toISOString(),
    statement_descriptor: "ESTILO Y GRENA",
  } });
}

export async function getVerifiedPayment(paymentId: string) { return new Payment(client()).get({ id: paymentId }); }
