import Link from "next/link";
import type { Metadata } from "next";
import { obtenerEventoYCodigoPorId } from "@/lib/db/galeria";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pago recibido — Tagui32",
  robots: { index: false, follow: false },
};

// Esta pantalla NUNCA marca nada como pagado — solo consulta el estado que
// ya haya dejado el webhook. La redirección de vuelta de MP no es la fuente
// de verdad (el cliente puede cerrar el navegador antes de volver acá).
export default async function GaleriaExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string }>;
}) {
  const { external_reference: eventoId } = await searchParams;
  const datos = eventoId ? await obtenerEventoYCodigoPorId(eventoId) : null;
  const yaPago = datos?.evento.estado === "pagado";
  const codigo = datos?.codigoAcceso?.codigo;

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-24 text-center sm:px-6 sm:py-32">
      <h1 className="font-heading text-3xl tracking-wide text-foreground">
        {yaPago ? "¡Pago recibido!" : "Estamos confirmando tu pago"}
      </h1>
      <p className="mt-4 text-muted-foreground">
        {yaPago
          ? "Ya podés descargar todas las fotos en original."
          : "Puede tardar unos segundos. Si no se actualiza, volvé a entrar a tu galería en un rato."}
      </p>
      {codigo && (
        <Button asChild size="lg" className="mt-8 self-center">
          <Link href={`/galeria/${codigo}`}>
            {yaPago ? "Ver mis fotos" : "Volver a mi galería"}
          </Link>
        </Button>
      )}
    </div>
  );
}
