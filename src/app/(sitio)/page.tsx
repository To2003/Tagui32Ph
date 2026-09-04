import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { obtenerConfiguracionCompleta } from "@/lib/db/configuracion";
import { formatearPrecio } from "@/lib/fecha";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { urlPublicaPreview } from "@/lib/r2";
import type { FotoPortfolio } from "@/lib/db/tipos";

// El precio y el portfolio salen de la base; revalidamos cada 5 minutos para
// que un cambio desde /admin no requiera redeploy.
export const revalidate = 300;

async function obtenerPortfolio() {
  const supabase = crearClienteAdmin();
  const { data } = await supabase
    .from("portfolio")
    .select("*")
    .eq("visible", true)
    .order("orden", { ascending: true });

  return ((data ?? []) as FotoPortfolio[]).map((f) => ({
    id: f.id,
    titulo: f.titulo ?? "",
    deporte: f.deporte ?? "",
    src: urlPublicaPreview(f.imagen_key),
  }));
}

const pasos = [
  {
    numero: "01",
    titulo: "Agendás",
    descripcion:
      "Completás el formulario con la fecha, el lugar y tu WhatsApp. Te confirmamos la cobertura a la brevedad.",
  },
  {
    numero: "02",
    titulo: "Jugamos y sacamos",
    descripcion:
      "El día del partido cubrimos todo el encuentro. Después editamos la mejor selección de fotos.",
  },
  {
    numero: "03",
    titulo: "Comprás y bajás",
    descripcion:
      "Te llega un código de acceso por 30 días. Ves las fotos, pagás el pack por Mercado Pago y descargás el ZIP completo.",
  },
];

export default async function Home() {
  const [config, portfolio] = await Promise.all([
    obtenerConfiguracionCompleta(),
    obtenerPortfolio(),
  ]);
  const precioBaseCentavos = Number(config.precio_base_centavos);
  const precioPorHoraCentavos = Number(config.precio_por_hora_centavos);
  const horasIncluidas = config.horas_incluidas;

  const fotoSobreMiUrl = config.sobre_mi_foto_key
    ? urlPublicaPreview(config.sobre_mi_foto_key)
    : null;
  const camaraUrl = config.sobre_mi_camara_key
    ? urlPublicaPreview(config.sobre_mi_camara_key)
    : null;
  const haySobreMi =
    fotoSobreMiUrl || config.sobre_mi_bio || config.sobre_mi_hobbies || config.sobre_mi_programador_texto;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-end overflow-hidden border-b border-border/60">
        <Image
          src="https://picsum.photos/id/1050/1920/1200"
          alt="Jugador en pleno partido, fotografiado por Tagui32"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
            Fotografía deportiva amateur
          </p>
          <h1 className="max-w-3xl font-heading text-5xl leading-[0.95] tracking-wide text-foreground sm:text-7xl md:text-8xl">
            La foto que tu equipo va a mirar mil veces.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Cubrimos tu partido, editamos la mejor selección y le entregamos a tu
            equipo un pack completo de fotos en alta calidad.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/agendar">Agendá tu cobertura</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href="/galeria">Ya me sacaron fotos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="font-heading text-3xl tracking-wide text-foreground sm:text-4xl">
            Cómo funciona
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {pasos.map((paso) => (
              <div key={paso.numero}>
                <span className="font-heading text-5xl text-primary">
                  {paso.numero}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {paso.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-heading text-3xl tracking-wide text-foreground sm:text-4xl">
                Algunas coberturas
              </h2>
              <p className="text-sm text-muted-foreground">
                Fútbol, básquet, vóley, rugby y lo que se juegue.
              </p>
            </div>
            <div className="mt-12 columns-2 gap-4 sm:columns-3">
              {portfolio.map((foto) => (
                <div
                  key={foto.id}
                  className="group relative mb-4 break-inside-avoid overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- ya viene redimensionada por el admin al subirla */}
                  <img
                    src={foto.src}
                    alt={foto.titulo}
                    className="h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-wider text-primary">
                        {foto.deporte}
                      </p>
                      <p className="text-sm text-white">{foto.titulo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sobre mí */}
      {haySobreMi && (
        <section id="sobre-mi" className="scroll-mt-16 border-b border-border/60 bg-background">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Quién saca las fotos</p>
            <h2 className="mt-4 font-heading text-3xl tracking-wide text-foreground sm:text-4xl">
              Sobre mí
            </h2>

            <div className="mt-12 flex flex-col gap-8 sm:flex-row sm:items-start">
              {fotoSobreMiUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- ya viene redimensionada por el admin
                <img
                  src={fotoSobreMiUrl}
                  alt="Foto de perfil"
                  className="w-full max-w-xs shrink-0 rounded-lg object-cover sm:w-64"
                />
              )}
              <div className="flex flex-col gap-6">
                {config.sobre_mi_bio && (
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {config.sobre_mi_bio}
                  </p>
                )}
                {config.sobre_mi_hobbies && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Fuera de la cancha
                    </p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed text-foreground">
                      {config.sobre_mi_hobbies}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {camaraUrl && (
              <div className="mt-12 border-t border-border/60 pt-10">
                {/* eslint-disable-next-line @next/next/no-img-element -- ya viene redimensionada por el admin */}
                <img
                  src={camaraUrl}
                  alt={config.sobre_mi_camara_texto || "Mi equipo"}
                  className="w-full max-w-lg rounded-lg object-cover"
                />
                {config.sobre_mi_camara_texto && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {config.sobre_mi_camara_texto}
                  </p>
                )}
              </div>
            )}

            {config.sobre_mi_programador_texto && (
              <div className="mt-12 rounded-lg border border-primary/30 bg-primary/5 p-6 sm:p-8">
                <p className="text-sm uppercase tracking-[0.3em] text-primary">Dato de color</p>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">
                  {config.sobre_mi_programador_texto}
                </p>
                {config.sobre_mi_programador_link && (
                  <a
                    href={config.sobre_mi_programador_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Ver más →
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Precio + CTA final */}
      <section className="bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">
            Precio de la cobertura
          </p>
          <h2 className="font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
            Desde {formatearPrecio(precioBaseCentavos)} el partido
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Un solo pago por todo el equipo, después del partido y con las fotos
            ya editadas. Sin seña, sin sorpresas. El responsable del equipo se
            organiza con el resto para juntar la plata.
          </p>
          <p className="text-sm text-muted-foreground">
            Incluye {horasIncluidas} {Number(horasIncluidas) === 1 ? "hora" : "horas"} de
            cobertura — cada hora extra, {formatearPrecio(precioPorHoraCentavos)} más.
          </p>
          <Button asChild size="lg" className="mt-2 text-base">
            <Link href="/agendar">Quiero agendar mi partido</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
