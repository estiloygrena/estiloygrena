import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Estilo y Greña — Peluquería en Guadalupe, Nuevo León", template: "%s — Estilo y Greña" },
  description: "Peluquería en Guadalupe, Nuevo León. Conoce nuestros cortes alternativos, servicios de color y trabajos. Agenda tu cita en línea.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "es_MX", title: "Estilo y Greña", description: "Peluquería en Guadalupe, Nuevo León. Conoce nuestros servicios y agenda tu próxima cita.", url: appUrl },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
