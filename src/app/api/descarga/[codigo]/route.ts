import { NextResponse } from "next/server";
import { validarCodigo } from "@/lib/db/galeria";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearUrlDescarga } from "@/lib/r2";
import type { Evento } from "@/lib/db/tipos";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo: codigoParam } = await params;
  const codigo = codigoParam.toUpperCase();

  const resultado = await validarCodigo(codigo);
  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.motivo === "vencido" ? "Ese código venció." : "Código inválido." },
      { status: 403 }
    );
  }

  const supabase = crearClienteAdmin();
  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", resultado.codigoAcceso.evento_id)
    .maybeSingle();

  const e = evento as Evento | null;
  if (!e || e.estado !== "pagado" || !e.zip_key) {
    return NextResponse.json({ error: "Este pack todavía no está pagado." }, { status: 403 });
  }

  const url = await crearUrlDescarga(e.zip_key);
  return NextResponse.redirect(url);
}
