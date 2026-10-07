"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";

const links = [
  ["Inicio", "/"],
  ["Servicios", "/servicios"],
  ["Galería", "/galeria"],
  ["Nosotros", "/#nosotros"],
  ["Ubicación", "/#ubicacion"],
  ["Contacto", "/#contacto"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-black/95">
      <div className="flex h-20 items-center justify-between px-5 sm:px-8">
        <Link href="/" className="leading-none">
          <Logo compact />
        </Link>
        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Navegación principal"
        >
          {links.map(([label, href]) => (
            <Link className="eyebrow hover:line-through" href={href} key={href}>
              {label}
            </Link>
          ))}
          <Link className="btn btn-light !min-h-10 !py-2" href="/agendar">
            Agenda
          </Link>
        </nav>
        <button
          className="border border-white px-3 py-2 text-xs font-black uppercase lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          className="grid border-t border-white px-5 py-4 lg:hidden"
        >
          {links.map(([label, href]) => (
            <Link
              className="border-b border-white/30 py-4 text-xl font-black uppercase"
              href={href}
              onClick={() => setOpen(false)}
              key={href}
            >
              {label}
            </Link>
          ))}
          <Link className="btn btn-light mt-5" href="/agendar">
            Agenda tu cita
          </Link>
        </nav>
      )}
    </header>
  );
}
