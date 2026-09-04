import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { CodigoForm } from "@/components/codigo-form";
import { COOKIE_GALERIA, verificarCookieGaleria } from "@/lib/sesion-galeria";

export const metadata: Metadata = {
  title: "Ver mis fotos — Tagui32",
};

export default async function GaleriaPage() {
  const cookieStore = await cookies();
  const ultimoCodigo = verificarCookieGaleria(cookieStore.get(COOKIE_GALERIA)?.value);

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-24 sm:px-6 sm:py-32">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">Tus fotos</p>
      <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground">
        Ingresá tu código
      </h1>
      <p className="mt-4 text-muted-foreground">
        Te lo mandamos por mail después del partido. 8 caracteres, sin
        distinguir mayúsculas. ¿Jugás en más de un equipo? Podés entrar con
        cualquiera de tus códigos cuando quieras.
      </p>

      {ultimoCodigo && (
        <Link
          href={`/galeria/${ultimoCodigo}`}
          className="mt-6 rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          Continuar con tu última galería ({ultimoCodigo})
        </Link>
      )}

      <div className="mt-10">
        <CodigoForm />
      </div>
    </div>
  );
}
