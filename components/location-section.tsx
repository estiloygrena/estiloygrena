import { Reveal } from "@/components/reveal";

const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3595.621278120056!2d-100.2207976!3d25.6838462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8662eb00694a3979%3A0xd8a886bc1beafee7!2sEstilo%20y%20Gre%C3%B1a!5e0!3m2!1ses-419!2smx!4v1790450181200!5m2!1ses-419!2smx";

export function LocationSection({
  address,
  googleMapsUrl,
}: {
  address: string;
  googleMapsUrl: string;
}) {
  return (
    <section
      id="ubicacion"
      className="scroll-mt-20 border-b-2 border-white px-5 py-20 sm:px-10"
    >
      <Reveal>
        <p className="eyebrow text-white/55">05 / Visítanos</p>
        <h2 className="display mt-4 text-6xl sm:text-8xl">Ubicación</h2>
      </Reveal>
      <div className="mt-12 grid border-2 border-white lg:grid-cols-[.72fr_1.28fr]">
        <Reveal className="flex min-h-72 flex-col justify-between border-b-2 border-white p-6 sm:p-8 lg:min-h-full lg:border-b-0 lg:border-r-2">
          <div>
            <p className="eyebrow text-white/45">Estilo y Greña / Guadalupe</p>
            <address className="mt-6 max-w-md text-2xl font-black not-italic leading-tight sm:text-3xl">
              {address}
            </address>
          </div>
          <a
            className="btn btn-light mt-10 w-fit"
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar ↗
          </a>
        </Reveal>
        <Reveal className="relative min-w-0 bg-white p-2">
          <iframe
            src={MAP_EMBED_URL}
            className="block h-[380px] w-full border-0 grayscale contrast-110 sm:h-[450px] lg:h-[520px]"
            title="Ubicación de Estilo y Greña"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </Reveal>
      </div>
    </section>
  );
}
