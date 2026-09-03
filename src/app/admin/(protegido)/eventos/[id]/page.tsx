import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { EstadoBadge } from "@/components/estado-badge";
import { formatearFecha, formatearFechaHora, formatearPrecio } from "@/lib/fecha";
import { Button } from "@/components/ui/button";
import { EditarPrecio } from "@/components/admin/editar-precio";
import { SubidaFotos } from "@/components/admin/subida-fotos";
import { ReenviarMailBoton } from "@/components/admin/reenviar-mail-boton";
import { confirmarEvento, rechazarEvento } from "../actions";
import type { Evento } from "@/lib/db/tipos";

export const metadata: Metadata = {
  title: "Evento — Admin Tagui32",
};

function linkWhatsapp(evento: Evento) {
  const numero = evento.contacto_whatsapp.replace(/\D/g, "");
  const mensaje = `Hola ${evento.contacto_nombre}! Te escribo por la cobertura de ${evento.equipo}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = crearClienteAdmin();
  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!evento) {
    notFound();
  }

  const e = evento as Evento;
  const yaTieneFotos = !["pendiente", "confirmado", "rechazado"].includes(e.estado);
  const precioEditable = e.estado !== "pagado" && e.estado !== "vencido";

  let cantidadFotos = 0;
  let codigoAcceso: { codigo: string; expira_en: string } | null = null;

  if (yaTieneFotos) {
    const [{ count }, { data: codigo }] = await Promise.all([
      supabase.from("fotos").select("*", { count: "exact", head: true }).eq("evento_id", id),
      supabase
        .from("codigos_acceso")
        .select("codigo, expira_en")
        .eq("evento_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    cantidadFotos = count ?? 0;
    codigoAcceso = codigo;
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/eventos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver a eventos
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl tracking-wide">{e.equipo}</h1>
        <EstadoBadge estado={e.estado} />
      </div>
      <p className="text-muted-foreground">{e.deporte}</p>

      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Fecha y hora</dt>
          <dd className="mt-1">{formatearFechaHora(e.fecha_partido)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Lugar</dt>
          <dd className="mt-1">{e.lugar}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Duración</dt>
          <dd className="mt-1">{e.duracion_horas ? `${e.duracion_horas} hs` : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Jugadores</dt>
          <dd className="mt-1">{e.cantidad_jugadores ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Precio del pack</dt>
          <dd className="mt-1">
            {precioEditable ? (
              <EditarPrecio eventoId={e.id} precioCentavos={e.precio_centavos} />
            ) : (
              formatearPrecio(e.precio_centavos)
            )}
          </dd>
        </div>
      </dl>

      {e.notas && (
        <div className="mt-6">
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Notas</dt>
          <dd className="mt-1 text-sm">{e.notas}</dd>
        </div>
      )}

      <div className="mt-8 border-t border-border/60 pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Contacto</p>
        <p className="mt-2">
          {e.contacto_nombre} — {e.contacto_email}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href={linkWhatsapp(e)} target="_blank" rel="noopener noreferrer">
              Escribir por WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {e.estado === "pendiente" && (
        <div className="mt-8 flex gap-3 border-t border-border/60 pt-6">
          <form action={confirmarEvento.bind(null, e.id)}>
            <Button type="submit">Confirmar cobertura</Button>
          </form>
          <form action={rechazarEvento.bind(null, e.id)}>
            <Button type="submit" variant="outline">
              Rechazar
            </Button>
          </form>
        </div>
      )}

      {e.estado === "confirmado" && (
        <div className="mt-8 border-t border-border/60 pt-6">
          <SubidaFotos eventoId={e.id} />
        </div>
      )}

      {yaTieneFotos && (
        <div className="mt-8 border-t border-border/60 pt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pack entregado</p>
          <p className="mt-2">
            {cantidadFotos} fotos ·{" "}
            {e.zip_bytes ? `${(e.zip_bytes / 1024 / 1024).toFixed(1)} MB de originales` : "—"}
          </p>
          {codigoAcceso && (
            <>
              <p className="mt-3">
                Código:{" "}
                <span className="font-heading text-xl tracking-widest">
                  {codigoAcceso.codigo}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Vence el {formatearFecha(codigoAcceso.expira_en)}
              </p>
              <div className="mt-4">
                <ReenviarMailBoton eventoId={e.id} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
