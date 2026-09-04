import Link from "next/link";
import type { Metadata } from "next";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { EstadoBadge } from "@/components/estado-badge";
import { formatearFechaHora, formatearPrecio } from "@/lib/fecha";
import { cn } from "@/lib/utils";
import type { Evento, EstadoEvento } from "@/lib/db/tipos";

export const metadata: Metadata = {
  title: "Eventos — Admin Tagui32",
};

const filtros: { valor: EstadoEvento | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "confirmado", etiqueta: "Confirmados" },
  { valor: "fotos_subidas", etiqueta: "Fotos subidas" },
  { valor: "pagado", etiqueta: "Pagados" },
  { valor: "rechazado", etiqueta: "Rechazados" },
  { valor: "vencido", etiqueta: "Vencidos" },
];

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = crearClienteAdmin();

  let query = supabase
    .from("eventos")
    .select("*")
    .order("created_at", { ascending: false });

  if (estado && estado !== "todos") {
    query = query.eq("estado", estado);
  }

  const { data: eventos } = await query;

  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);
  const { data: pagosDelMes } = await supabase
    .from("pagos")
    .select("monto_centavos")
    .eq("estado", "approved")
    .gte("created_at", inicioDeMes.toISOString());

  const ingresosDelMes = (pagosDelMes ?? []).reduce((acc, p) => acc + p.monto_centavos, 0);

  return (
    <div>
      <h1 className="font-heading text-3xl tracking-wide">Eventos</h1>

      <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
        <p>
          <span className="text-foreground">{pagosDelMes?.length ?? 0}</span> packs vendidos este
          mes
        </p>
        <p>
          <span className="text-foreground">{formatearPrecio(ingresosDelMes)}</span> facturados
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Link
            key={f.valor}
            href={f.valor === "todos" ? "/admin/eventos" : `/admin/eventos?estado=${f.valor}`}
            className={cn(
              "rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
              (estado ?? "todos") === f.valor && "border-primary text-foreground"
            )}
          >
            {f.etiqueta}
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {(eventos as Evento[] | null)?.length ? (
          (eventos as Evento[]).map((evento) => (
            <Link
              key={evento.id}
              href={`/admin/eventos/${evento.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border/60 p-4 transition-colors hover:border-border sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {evento.equipo}{" "}
                  <span className="text-muted-foreground">— {evento.deporte}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatearFechaHora(evento.fecha_partido)} · {evento.lugar}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {formatearPrecio(evento.precio_centavos)}
                </span>
                <EstadoBadge estado={evento.estado} />
              </div>
            </Link>
          ))
        ) : (
          <p className="text-muted-foreground">No hay eventos para mostrar.</p>
        )}
      </div>
    </div>
  );
}
