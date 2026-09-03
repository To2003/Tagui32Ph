import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import type { CodigoAcceso, Evento, Foto } from "@/lib/db/tipos";

export type ResultadoCodigo =
  | { ok: true; codigoAcceso: CodigoAcceso }
  | { ok: false; motivo: "no_existe" | "vencido" };

export async function validarCodigo(codigo: string): Promise<ResultadoCodigo> {
  const supabase = crearClienteAdmin();
  const { data } = await supabase
    .from("codigos_acceso")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();

  if (!data) return { ok: false, motivo: "no_existe" };
  if (new Date(data.expira_en).getTime() < Date.now()) {
    return { ok: false, motivo: "vencido" };
  }
  return { ok: true, codigoAcceso: data as CodigoAcceso };
}

export async function obtenerGaleria(codigo: string) {
  const resultado = await validarCodigo(codigo);
  if (!resultado.ok) return resultado;

  const supabase = crearClienteAdmin();
  const { codigoAcceso } = resultado;

  const [{ data: evento }, { data: fotos }] = await Promise.all([
    supabase.from("eventos").select("*").eq("id", codigoAcceso.evento_id).maybeSingle(),
    supabase
      .from("fotos")
      .select("*")
      .eq("evento_id", codigoAcceso.evento_id)
      .order("orden", { ascending: true }),
  ]);

  if (!evento) return { ok: false as const, motivo: "no_existe" as const };

  // No es crítico si falla — es solo un contador informativo.
  await supabase
    .from("codigos_acceso")
    .update({ usos: codigoAcceso.usos + 1 })
    .eq("id", codigoAcceso.id);

  return {
    ok: true as const,
    evento: evento as Evento,
    fotos: (fotos ?? []) as Foto[],
    codigoAcceso,
  };
}
