import type { Metadata } from "next";
import { obtenerConfiguracionCompleta } from "@/lib/db/configuracion";
import { urlPublicaPreview } from "@/lib/r2";
import { guardarTextosSobreMi } from "./actions";
import { SubidaImagenSobreMi } from "@/components/admin/subida-imagen-sobre-mi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Sobre mí — Admin Tagui32",
};

export default async function SobreMiAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const config = await obtenerConfiguracionCompleta();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl tracking-wide">Sobre mí</h1>
      <p className="mt-2 text-muted-foreground">
        Se muestra en /sobre-mi. Es tu espacio para contar quién sos, no solo
        el negocio.
      </p>

      {guardado && (
        <p className="mt-4 rounded-md bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">
          Guardado.
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SubidaImagenSobreMi
          campo="sobre_mi_foto_key"
          label="Tu foto"
          urlActual={config.sobre_mi_foto_key ? urlPublicaPreview(config.sobre_mi_foto_key) : null}
        />
        <SubidaImagenSobreMi
          campo="sobre_mi_camara_key"
          label="Foto de tu cámara/equipo"
          urlActual={
            config.sobre_mi_camara_key ? urlPublicaPreview(config.sobre_mi_camara_key) : null
          }
        />
      </div>

      <form action={guardarTextosSobreMi} className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">Sobre vos</Label>
          <p className="text-sm text-muted-foreground">
            Quién sos, hace cuánto sacás fotos, qué te gusta del deporte amateur.
          </p>
          <Textarea id="bio" name="bio" defaultValue={config.sobre_mi_bio} rows={6} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hobbies">Hobbies</Label>
          <Textarea
            id="hobbies"
            name="hobbies"
            defaultValue={config.sobre_mi_hobbies}
            rows={3}
            placeholder="Andar en bici, cocinar, ver series..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="camaraTexto">Texto de la foto del equipo</Label>
          <Input
            id="camaraTexto"
            name="camaraTexto"
            defaultValue={config.sobre_mi_camara_texto}
            placeholder="Mi Sony A7III con 70-200mm"
          />
        </div>

        <div className="flex flex-col gap-4 border-t border-border/60 pt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Che, también programo
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="programadorTexto">Texto</Label>
            <p className="text-sm text-muted-foreground">
              Tu momento de propaganda. Se muestra en un cartel destacado.
            </p>
            <Textarea
              id="programadorTexto"
              name="programadorTexto"
              defaultValue={config.sobre_mi_programador_texto}
              rows={4}
              placeholder="Además de las fotos, armo webs y apps a medida..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="programadorLink">Link (opcional)</Label>
            <Input
              id="programadorLink"
              name="programadorLink"
              type="url"
              defaultValue={config.sobre_mi_programador_link}
              placeholder="https://tu-portfolio.com"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="self-start">
          Guardar
        </Button>
      </form>
    </div>
  );
}
