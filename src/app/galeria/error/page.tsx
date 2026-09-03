import Link from "next/link";
import type { Metadata } from "next";
import { obtenerEventoYCodigoPorId } from "@/lib/db/galeria";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "El pago no se pudo procesar — Tagui32",
  robots: { index: false, follow: false },
};

export default async function GaleriaErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string }>;
}) {
  const { external_reference: eventoId } = await searchParams;
  const datos = eventoId ? await obtenerEventoYCodigoPorId(eventoId) : null;
  const codigo = datos?.codigoAcceso?.codigo;

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-24 text-center sm:px-6 sm:py-32">
      <h1 className="font-heading text-3xl tracking-wide text-foreground">
        El pago no se pudo procesar
      </h1>
      <p className="mt-4 text-muted-foreground">
        No te cobramos nada. Podés volver a intentar cuando quieras desde tu
        galería.
      </p>
      <Button asChild size="lg" className="mt-8 self-center">
        <Link href={codigo ? `/galeria/${codigo}` : "/galeria"}>Volver a mi galería</Link>
      </Button>
    </div>
  );
}
