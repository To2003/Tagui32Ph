import type { Metadata } from "next";
import { obtenerConfiguracion } from "@/lib/db/configuracion";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Términos y condiciones — Tagui32",
};

export default async function TerminosPage() {
  const texto = (await obtenerConfiguracion("terminos_texto")) ?? "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-heading text-4xl tracking-wide text-foreground">
        Términos y condiciones
      </h1>
      <p className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">
        {texto}
      </p>
    </div>
  );
}
