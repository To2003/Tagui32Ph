import type { Metadata } from "next";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { urlPublicaPreview } from "@/lib/r2";
import { SubidaPortfolio } from "@/components/admin/subida-portfolio";
import { Button } from "@/components/ui/button";
import { alternarVisible, eliminarFotoPortfolio, moverFotoPortfolio } from "./actions";
import type { FotoPortfolio } from "@/lib/db/tipos";

export const metadata: Metadata = {
  title: "Portfolio — Admin Tagui32",
};

export default async function PortfolioAdminPage() {
  const supabase = crearClienteAdmin();
  const { data: fotos } = await supabase
    .from("portfolio")
    .select("*")
    .order("orden", { ascending: true });

  const lista = (fotos ?? []) as FotoPortfolio[];

  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-3xl tracking-wide">Portfolio</h1>
      <p className="mt-2 text-muted-foreground">
        Estas son las fotos de ejemplo que se muestran en la home. No tienen
        marca de agua — son tu vidriera, no fotos en venta.
      </p>

      <div className="mt-8">
        <SubidaPortfolio />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {lista.length === 0 && (
          <p className="text-muted-foreground">Todavía no subiste ninguna foto.</p>
        )}
        {lista.map((foto, i) => (
          <div
            key={foto.id}
            className="flex items-center gap-4 rounded-lg border border-border/60 p-3"
          >
            <img
              src={urlPublicaPreview(foto.imagen_key)}
              alt={foto.titulo ?? ""}
              className="h-16 w-24 rounded object-cover"
            />
            <div className="flex-1">
              <p className="text-foreground">{foto.titulo || "Sin título"}</p>
              <p className="text-sm text-muted-foreground">{foto.deporte || "—"}</p>
            </div>

            <form action={moverFotoPortfolio.bind(null, foto.id, "arriba")}>
              <Button type="submit" variant="ghost" size="icon-sm" disabled={i === 0}>
                ↑
              </Button>
            </form>
            <form action={moverFotoPortfolio.bind(null, foto.id, "abajo")}>
              <Button type="submit" variant="ghost" size="icon-sm" disabled={i === lista.length - 1}>
                ↓
              </Button>
            </form>
            <form action={alternarVisible.bind(null, foto.id, !foto.visible)}>
              <Button type="submit" variant="outline" size="sm">
                {foto.visible ? "Ocultar" : "Mostrar"}
              </Button>
            </form>
            <form action={eliminarFotoPortfolio.bind(null, foto.id)}>
              <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                Eliminar
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
