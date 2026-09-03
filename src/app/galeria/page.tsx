import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CodigoForm } from "@/components/codigo-form";
import { COOKIE_GALERIA, verificarCookieGaleria } from "@/lib/sesion-galeria";

export const metadata: Metadata = {
  title: "Ver mis fotos — Tagui32",
};

export default async function GaleriaPage() {
  const cookieStore = await cookies();
  const codigo = verificarCookieGaleria(cookieStore.get(COOKIE_GALERIA)?.value);

  if (codigo) {
    redirect(`/galeria/${codigo}`);
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-24 sm:px-6 sm:py-32">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">Tus fotos</p>
      <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground">
        Ingresá tu código
      </h1>
      <p className="mt-4 text-muted-foreground">
        Te lo mandamos por mail después del partido. 8 caracteres, sin
        distinguir mayúsculas.
      </p>
      <div className="mt-10">
        <CodigoForm />
      </div>
    </div>
  );
}
