import { NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { enviarMailResumenSolicitudes } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

// Se llama cada 30 minutos (cron externo, ver README/instrucciones de
// despliegue) y manda UN mail con todas las solicitudes que llegaron desde
// la última corrida — no uno por solicitud.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = crearClienteAdmin();

  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("notificado_admin", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al buscar solicitudes sin notificar:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  if (!eventos || eventos.length === 0) {
    return NextResponse.json({ ok: true, notificadas: 0 });
  }

  try {
    await enviarMailResumenSolicitudes(eventos as Evento[]);
  } catch (err) {
    // No se marca como notificado: se reintenta en la próxima corrida.
    console.error("Error al mandar el resumen de solicitudes:", err);
    return NextResponse.json({ error: "No se pudo mandar el resumen" }, { status: 500 });
  }

  const ids = eventos.map((evento) => evento.id);
  await supabase.from("eventos").update({ notificado_admin: true }).in("id", ids);

  return NextResponse.json({ ok: true, notificadas: eventos.length });
}
