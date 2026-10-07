import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/logo";
import { getSettings } from "@/lib/settings";
import { SideCollages } from "@/components/side-collage";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return <><SideCollages /><div className="shell"><SiteHeader />{children}<footer className="grid gap-8 border-t-2 border-white px-5 py-12 sm:grid-cols-2 sm:px-10"><Logo compact /><div className="grid gap-2 text-sm sm:text-right"><a href={settings.instagramUrl}>Instagram ↗</a><a href={`https://wa.me/${settings.whatsappNumber}`}>WhatsApp ↗</a><span>{settings.address}</span><div className="mt-3 flex gap-4 sm:justify-end"><a className="underline" href="/privacidad">Privacidad</a><a className="underline" href="/politica-de-cancelacion">Cancelación</a></div></div></footer></div></>;
}
