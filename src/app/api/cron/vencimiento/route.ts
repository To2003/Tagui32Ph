import { NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { enviarMailAvisoVencimiento } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = crearClienteAdmin();
  const ahora = new Date();
  const en3Dias = new Date(ahora.getTime() + TRES_DIAS_MS);

  // 1. Marcar como vencidos los eventos cuyo código ya expiró.
  const { data: candidatosVencidos } = await supabase
    .from("codigos_acceso")
    .select("evento_id, eventos(estado)")
    .lt("expira_en", ahora.toISOString());

  const idsAVencer = (candidatosVencidos ?? [])
    .filter((c) => {
      const evento = c.eventos as unknown as { estado: string } | null;
      return evento && ["fotos_subidas", "pagado"].includes(evento.estado);
    })
    .map((c) => c.evento_id);

  let vencidos = 0;
  if (idsAVencer.length > 0) {
    const { data } = await supabase
      .from("eventos")
      .update({ estado: "vencido" })
      .in("id", idsAVencer)
      .in("estado", ["fotos_subidas", "pagado"])
      .select();
    vencidos = data?.length ?? 0;
  }

  // 2. Avisar a quienes todavía no compraron y les vence en menos de 3 días.
  const { data: candidatosAviso } = await supabase
    .from("codigos_acceso")
    .select("id, codigo, expira_en, eventos(*)")
    .eq("aviso_vencimiento_enviado", false)
    .gte("expira_en", ahora.toISOString())
    .lte("expira_en", en3Dias.toISOString());

  let avisos = 0;
  for (const c of candidatosAviso ?? []) {
    const evento = c.eventos as unknown as Evento | null;
    if (!evento || evento.estado !== "fotos_subidas") continue;

    try {
      await enviarMailAvisoVencimiento(evento, c.codigo, c.expira_en);
      await supabase
        .from("codigos_acceso")
        .update({ aviso_vencimiento_enviado: true })
        .eq("id", c.id);
      avisos++;
    } catch (err) {
      console.error(`No se pudo mandar aviso de vencimiento (${c.codigo}):`, err);
    }
  }

  return NextResponse.json({ ok: true, vencidos, avisos });
}
