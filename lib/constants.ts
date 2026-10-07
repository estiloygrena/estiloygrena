export const SALON_TIMEZONE = "America/Monterrey";
export const PAYMENT_HOLD_MINUTES = 15;
export const DEFAULT_SLOT_INTERVAL = 30;
export const DEFAULT_QUOTE_LABEL = "Se cotiza por WhatsApp";
export const ACTIVE_APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED"] as const;

export const DEFAULT_SETTINGS = {
  salonName: "Estilo y Greña",
  tagline: "Cortes sin molde.",
  address: "Gral. Plutarco Elías Calles 3216, Riberas del Río, 67160 Guadalupe, N.L., México",
  instagramUrl: "https://instagram.com/estiloygrena",
  whatsappNumber: "528100000000",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Estilo%20y%20Gre%C3%B1a%2C%20Gral.%20Plutarco%20El%C3%ADas%20Calles%203216%2C%20Riberas%20del%20R%C3%ADo%2C%2067160%20Guadalupe%2C%20N.L.%2C%20M%C3%A9xico",
  slotIntervalMinutes: "30",
  cancellationPolicy: "Avísanos con al menos 24 horas de anticipación para mover o cancelar tu cita.",
} as const;
