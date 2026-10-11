"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";

const nav = [
  ["Resumen", "/admin"],
  ["Citas", "/admin/citas"],
  ["Calendario", "/admin/calendario"],
  ["Servicios", "/admin/servicios"],
  ["Horarios", "/admin/horarios"],
  ["Bloqueos", "/admin/bloqueos"],
  ["Galería", "/admin/galeria"],
  ["Configuración", "/admin/configuracion"],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="border-b-2 border-black bg-black text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r-2 lg:border-white">
      <div className="border-b border-white/40 p-6">
        <Link href="/" className="display text-3xl">
          Estilo
          <br />y Greña
        </Link>
        <p className="eyebrow mt-4 text-white/45">Administración</p>
      </div>
      <nav className="flex overflow-x-auto lg:grid">
        {nav.map(([label, href], index) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-r border-white/30 px-5 py-4 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black lg:border-b lg:border-r-0 ${active ? "bg-white text-black" : ""}`}
              key={href}
              href={href}
            >
              <span
                className={`mr-3 ${active ? "text-black/40" : "text-white/35"}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="p-5 lg:mt-auto">
        <SubmitButton className="btn w-full" type="submit" pendingText="Saliendo…">
          Cerrar sesión
        </SubmitButton>
      </form>
    </aside>
  );
}
