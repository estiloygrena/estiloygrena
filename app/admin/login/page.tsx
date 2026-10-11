import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { loginAction } from "@/app/admin/actions";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="login-surface relative grid min-h-screen place-items-center overflow-hidden bg-[var(--paper)] p-5 text-black">
      <span className="display pointer-events-none absolute -left-10 top-8 rotate-[-8deg] text-[18vw] text-black/[.035]">
        ADMIN
      </span>
      <form
        action={loginAction}
        className="relative w-full max-w-md border-4 border-black bg-white p-7 shadow-[12px_12px_0_#000]"
      >
        <p className="eyebrow">Panel de administración</p>
        <h1 className="display mt-3 text-5xl">Iniciar sesión</h1>
        {error && (
          <p
            className="mt-5 border-2 border-black bg-black p-3 text-sm font-bold text-white"
            role="alert"
          >
            {error === "demasiados-intentos"
              ? "Demasiados intentos. Espera 15 minutos."
              : "Usuario o contraseña incorrectos."}
          </p>
        )}
        <label className="mt-7 block">
          <span className="label">Usuario</span>
          <input
            className="field !border-black !text-black"
            name="username"
            autoComplete="username"
            required
          />
        </label>
        <label className="mt-5 block">
          <span className="label">Contraseña</span>
          <input
            className="field !border-black !text-black"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <SubmitButton
          className="btn mt-7 w-full !border-black bg-black text-white"
          pendingText="Entrando…"
          type="submit"
        >
          Iniciar sesión →
        </SubmitButton>
        <Link
          className="mt-5 block text-center text-xs font-bold uppercase underline"
          href="/"
        >
          Volver al sitio
        </Link>
      </form>
    </main>
  );
}
