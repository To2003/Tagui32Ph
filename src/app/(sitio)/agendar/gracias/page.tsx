import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Solicitud recibida — Tagui32",
};

export default function AgendarGraciasPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-4 py-24 sm:px-6 sm:py-32">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">
        Listo
      </p>
      <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
        Recibimos tu solicitud
      </h1>
      <p className="mt-4 text-muted-foreground">
        Te mandamos un mail de confirmación. Te vamos a escribir a la
        brevedad para confirmar la cobertura de tu partido.
      </p>
      <Button asChild size="lg" className="mt-8 text-base">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
