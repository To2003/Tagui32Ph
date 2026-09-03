import Link from "next/link";
import type { Metadata } from "next";
import { obtenerEventoYCodigoPorId } from "@/lib/db/galeria";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pago pendiente — Tagui32",
  robots: { index: false, follow: false },
};

export default async function GaleriaPendientePage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string }>;
}) {
  const { external_reference: eventoId } = await searchParams;
  const datos = eventoId ? await obtenerEventoYCodigoPorId(eventoId) : null;
  const codigo = datos?.codigoAcceso?.codigo;

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-24 text-center sm:px-6 sm:py-32">
      <h1 className="font-heading text-3xl tracking-wide text-foreground">Pago pendiente</h1>
      <p className="mt-4 text-muted-foreground">
        Tu pago está pendiente de aprobación (por ejemplo, si pagaste con un
        medio que se acredita más tarde). En cuanto se confirme te mandamos
        un mail.
      </p>
      <Button asChild size="lg" className="mt-8 self-center">
        <Link href={codigo ? `/galeria/${codigo}` : "/galeria"}>Volver a mi galería</Link>
      </Button>
    </div>
  );
}
