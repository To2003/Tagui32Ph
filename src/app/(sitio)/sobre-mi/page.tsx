import type { Metadata } from "next";
import { obtenerConfiguracionCompleta } from "@/lib/db/configuracion";
import { urlPublicaPreview } from "@/lib/r2";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre mí — Tagui32",
};

export default async function SobreMiPage() {
  const config = await obtenerConfiguracionCompleta();

  const fotoUrl = config.sobre_mi_foto_key ? urlPublicaPreview(config.sobre_mi_foto_key) : null;
  const camaraUrl = config.sobre_mi_camara_key
    ? urlPublicaPreview(config.sobre_mi_camara_key)
    : null;

  const hayContenido =
    fotoUrl || config.sobre_mi_bio || config.sobre_mi_hobbies || config.sobre_mi_programador_texto;

  if (!hayContenido) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <h1 className="font-heading text-4xl tracking-wide text-foreground">Sobre mí</h1>
        <p className="mt-4 text-muted-foreground">Estamos armando esta sección. Volvé pronto.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">Quién saca las fotos</p>
      <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
        Sobre mí
      </h1>

      <div className="mt-12 flex flex-col gap-8 sm:flex-row sm:items-start">
        {fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ya viene redimensionada por el admin
          <img
            src={fotoUrl}
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
        <div className="mt-16 border-t border-border/60 pt-12">
          {/* eslint-disable-next-line @next/next/no-img-element -- ya viene redimensionada por el admin */}
          <img
            src={camaraUrl}
            alt={config.sobre_mi_camara_texto || "Mi equipo"}
            className="w-full max-w-lg rounded-lg object-cover"
          />
          {config.sobre_mi_camara_texto && (
            <p className="mt-3 text-sm text-muted-foreground">{config.sobre_mi_camara_texto}</p>
          )}
        </div>
      )}

      {config.sobre_mi_programador_texto && (
        <div className="mt-16 rounded-lg border border-primary/30 bg-primary/5 p-6 sm:p-8">
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
  );
}
