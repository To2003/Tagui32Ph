import type { Metadata } from "next";
import { obtenerConfiguracionCompleta } from "@/lib/db/configuracion";
import { guardarConfig, crearCupon, alternarCupon, eliminarCupon } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Configuración — Admin Tagui32",
};

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;
  const config = await obtenerConfiguracionCompleta();
  const hayCupon = config.codigo_descuento.length > 0;
  const cuponActivo = config.descuento_activo === "true";

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl tracking-wide">Configuración</h1>
      <p className="mt-2 text-muted-foreground">
        Estos valores se usan en toda la web sin necesidad de tocar código.
      </p>

      {guardado && (
        <p className="mt-4 rounded-md bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400">
          Guardado.
        </p>
      )}

      <form action={guardarConfig} className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">General</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precioBase">Precio base del pack ($)</Label>
              <Input
                id="precioBase"
                name="precioBase"
                type="number"
                min="0"
                step="1"
                defaultValue={Number(config.precio_base_centavos) / 100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="horasIncluidas">Horas incluidas</Label>
              <Input
                id="horasIncluidas"
                name="horasIncluidas"
                type="number"
                min="0.5"
                step="0.5"
                defaultValue={config.horas_incluidas}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="precioPorHora">Precio por hora extra ($)</Label>
            <p className="text-sm text-muted-foreground">
              Se cobra proporcional por lo que pase de las horas incluidas.
            </p>
            <Input
              id="precioPorHora"
              name="precioPorHora"
              type="number"
              min="0"
              step="1"
              defaultValue={Number(config.precio_por_hora_centavos) / 100}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deportesDisponibles">Deportes disponibles</Label>
            <p className="text-sm text-muted-foreground">
              Separados por coma. Así aparecen en el formulario de /agendar.
            </p>
            <Input
              id="deportesDisponibles"
              name="deportesDisponibles"
              defaultValue={config.deportes_disponibles}
              placeholder="Fútbol, Básquet, Vóley"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactoEmail">Mail de contacto</Label>
            <Input
              id="contactoEmail"
              name="contactoEmail"
              type="email"
              defaultValue={config.contacto_email}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactoWhatsapp">WhatsApp de contacto</Label>
            <Input
              id="contactoWhatsapp"
              name="contactoWhatsapp"
              defaultValue={config.contacto_whatsapp}
              placeholder="549 11 1234 5678"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-6">
          <Label htmlFor="terminosTexto">Términos y condiciones</Label>
          <p className="mb-1 text-sm text-muted-foreground">
            Se muestra tal cual en /terminos. Los saltos de línea se respetan.
          </p>
          <Textarea
            id="terminosTexto"
            name="terminosTexto"
            defaultValue={config.terminos_texto}
            rows={12}
          />
        </div>

        <Button type="submit" size="lg" className="self-start">
          Guardar
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-4 border-t border-border/60 pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Cupón de descuento</p>
        <p className="text-sm text-muted-foreground">Un solo código a la vez.</p>

        {hayCupon ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className={cn(
                "border-0 px-3 py-1 text-sm",
                cuponActivo ? "bg-emerald-500/15 text-emerald-400" : "bg-neutral-500/15 text-neutral-400"
              )}
            >
              {config.codigo_descuento} — {config.descuento_porcentaje}% off
            </Badge>
            <span className="text-sm text-muted-foreground">
              {cuponActivo ? "Activo" : "Inactivo"}
            </span>
            <form action={alternarCupon.bind(null, !cuponActivo)}>
              <Button type="submit" variant="outline" size="sm">
                {cuponActivo ? "Desactivar" : "Activar"}
              </Button>
            </form>
            <form action={eliminarCupon}>
              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                Eliminar
              </Button>
            </form>
          </div>
        ) : (
          <form action={crearCupon} className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="codigoDescuento">Código</Label>
              <Input
                id="codigoDescuento"
                name="codigoDescuento"
                placeholder="BIENVENIDA10"
                className="uppercase"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descuentoPorcentaje">Descuento (%)</Label>
              <Input
                id="descuentoPorcentaje"
                name="descuentoPorcentaje"
                type="number"
                min="1"
                max="100"
                placeholder="10"
              />
            </div>
            <Button type="submit" className="col-span-2 self-start">
              Crear cupón
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
