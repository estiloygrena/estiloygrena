import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/logo";
import { getSettings } from "@/lib/settings";
import { SideCollages } from "@/components/side-collage";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return <><SideCollages /><div className="shell"><SiteHeader />{children}<footer className="grid gap-8 border-t-2 border-white px-5 py-12 sm:grid-cols-2 sm:px-10"><Logo compact /><div className="grid min-w-0 gap-2 text-sm sm:text-right">{settings.instagramUrl && <a href={settings.instagramUrl}>Instagram ↗</a>}{settings.whatsappNumber && <a href={`https://wa.me/${settings.whatsappNumber}`}>WhatsApp ↗</a>}<span>{settings.address}</span><div className="mt-3 flex gap-4 sm:justify-end"><a className="underline" href="/privacidad">Aviso de privacidad</a><a className="underline" href="/politica-de-cancelacion">Cancelaciones</a></div></div></footer></div></>;
}
