import type { Metadata } from "next";
import Link from "next/link";
import { obtenerGaleria } from "@/lib/db/galeria";
import { urlPublicaPreview } from "@/lib/r2";
import { formatearFecha, formatearPrecio } from "@/lib/fecha";
import { GaleriaGrid } from "@/components/galeria/galeria-grid";
import { ComprarBoton } from "@/components/galeria/comprar-boton";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tus fotos — Tagui32",
  robots: { index: false, follow: false },
};

export default async function GaleriaCodigoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo: codigoParam } = await params;
  const codigo = codigoParam.toUpperCase();
  const resultado = await obtenerGaleria(codigo);

  if (!resultado.ok) {
    return (
      <div className="mx-auto flex max-w-sm flex-col px-4 py-24 text-center sm:px-6 sm:py-32">
        <h1 className="font-heading text-3xl tracking-wide text-foreground">
          {resultado.motivo === "vencido" ? "Che, ese código venció" : "No encontramos ese código"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {resultado.motivo === "vencido"
            ? "El acceso a las fotos dura 30 días. Si todavía las necesitás, escribinos."
            : "Revisá que esté bien escrito, tal como te lo mandamos por mail."}
        </p>
        <Button asChild size="lg" className="mt-8 self-center">
          <Link href="/galeria">Probar de nuevo</Link>
        </Button>
      </div>
    );
  }

  const { evento, fotos } = resultado;
  const fotosConUrl = fotos.map((f) => ({
    src: urlPublicaPreview(f.preview_key),
    ancho: f.ancho,
    alto: f.alto,
  }));
  const yaPago = evento.estado === "pagado";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-2 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">{evento.deporte}</p>
          <h1 className="mt-2 font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
            {evento.equipo}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {formatearFecha(evento.fecha_partido)} · {fotos.length} fotos
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-2xl font-semibold text-foreground">
            {formatearPrecio(evento.precio_centavos)}
          </p>
          {yaPago ? (
            <Button asChild size="lg">
              <a href={`/api/descarga/${codigo}`}>Descargar todas</a>
            </Button>
          ) : (
            <ComprarBoton codigo={codigo} />
          )}
        </div>
      </div>

      <div className="mt-10">
        {fotos.length > 0 ? (
          <GaleriaGrid fotos={fotosConUrl} />
        ) : (
          <p className="text-muted-foreground">Todavía no hay fotos cargadas para este evento.</p>
        )}
      </div>
    </div>
  );
}
