import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Datos de ejemplo hardcodeados — en la Fase 6 esto sale de la tabla `portfolio`
// y se administra desde /admin/portfolio.
const portfolio = [
  { id: 1, titulo: "Semifinal — Fútbol 5", deporte: "Fútbol", src: "https://picsum.photos/id/1011/900/1200" },
  { id: 2, titulo: "Saque de esquina", deporte: "Fútbol", src: "https://picsum.photos/id/1015/900/700" },
  { id: 3, titulo: "Rulo bajo los reflectores", deporte: "Fútbol", src: "https://picsum.photos/id/1016/900/1100" },
  { id: 4, titulo: "Bloqueo en la red", deporte: "Vóley", src: "https://picsum.photos/id/1021/900/900" },
  { id: 5, titulo: "Doble amague", deporte: "Básquet", src: "https://picsum.photos/id/1024/900/1300" },
  { id: 6, titulo: "Festejo del equipo", deporte: "Fútbol", src: "https://picsum.photos/id/1035/900/1000" },
  { id: 7, titulo: "Arquero volando", deporte: "Fútbol", src: "https://picsum.photos/id/1041/900/700" },
  { id: 8, titulo: "Pique en la banda", deporte: "Rugby", src: "https://picsum.photos/id/1043/900/1200" },
];

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

// En la Fase 6 esto sale de la tabla `configuracion`, editable desde /admin/config.
const precioBaseCentavos = 1500000;

function formatearPrecio(centavos: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}

export default function Home() {
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
                <Image
                  src={foto.src}
                  alt={foto.titulo}
                  width={900}
                  height={1200}
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
          <Button asChild size="lg" className="mt-2 text-base">
            <Link href="/agendar">Quiero agendar mi partido</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
