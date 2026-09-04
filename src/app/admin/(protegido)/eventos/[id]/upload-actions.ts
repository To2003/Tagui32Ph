"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearUrlSubida } from "@/lib/r2";
import { generarCodigo } from "@/lib/codigo";
import { enviarMailFotosListas } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

export async function crearUrlsDeSubida(
  eventoId: string,
  cantidadFotos: number,
  zipContentType: string
) {
  const zipKey = `eventos/${eventoId}/originales.zip`;

  const [zipUrl, previews] = await Promise.all([
    crearUrlSubida(zipKey, zipContentType || "application/zip"),
    Promise.all(
      Array.from({ length: cantidadFotos }, async () => {
        const key = `eventos/${eventoId}/previews/${crypto.randomUUID()}.jpg`;
        const url = await crearUrlSubida(key, "image/jpeg");
        return { key, url };
      })
    ),
  ]);

  return { zip: { key: zipKey, url: zipUrl }, previews };
}

async function crearCodigoAcceso(
  supabase: ReturnType<typeof crearClienteAdmin>,
  eventoId: string
) {
  const expiraEn = new Date(Date.now() + TREINTA_DIAS_MS).toISOString();

  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigo();
    const { data, error } = await supabase
      .from("codigos_acceso")
      .insert({ evento_id: eventoId, codigo, expira_en: expiraEn })
      .select()
      .single();

    if (!error) return data;
    if (error.code !== "23505") throw error; // no es choque de código único, es otro error
  }

  throw new Error("No se pudo generar un código de acceso único");
}

export async function finalizarCargaFotos(
  eventoId: string,
  zipBytes: number,
  fotos: { key: string; ancho: number; alto: number; orden: number }[]
) {
  const supabase = crearClienteAdmin();

  const { error: errorFotos } = await supabase.from("fotos").insert(
    fotos.map((f) => ({
      evento_id: eventoId,
      preview_key: f.key,
      ancho: f.ancho,
      alto: f.alto,
      orden: f.orden,
    }))
  );
  if (errorFotos) {
    return { error: "No pudimos registrar las fotos. Probá de nuevo." };
  }

  const { data: evento, error: errorEvento } = await supabase
    .from("eventos")
    .update({
      estado: "fotos_subidas",
      zip_key: `eventos/${eventoId}/originales.zip`,
      zip_bytes: zipBytes,
    })
    .eq("id", eventoId)
    .select()
    .single();

  if (errorEvento || !evento) {
    return { error: "No pudimos actualizar el evento." };
  }

  const codigoAcceso = await crearCodigoAcceso(supabase, eventoId);

  try {
    await enviarMailFotosListas(evento as Evento, codigoAcceso.codigo, codigoAcceso.expira_en);
  } catch (err) {
    console.error("Error al mandar el mail de fotos listas:", err);
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventoId}`);

  return { codigo: codigoAcceso.codigo, expiraEn: codigoAcceso.expira_en };
}

export async function reenviarMailFotos(eventoId: string) {
  const supabase = crearClienteAdmin();

  const [{ data: evento }, { data: codigoAcceso }] = await Promise.all([
    supabase.from("eventos").select("*").eq("id", eventoId).single(),
    supabase
      .from("codigos_acceso")
      .select("*")
      .eq("evento_id", eventoId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!evento || !codigoAcceso) {
    return { error: "No encontramos el código de este evento." };
  }

  try {
    await enviarMailFotosListas(evento as Evento, codigoAcceso.codigo, codigoAcceso.expira_en);
  } catch (err) {
    console.error("Error al reenviar el mail:", err);
    return { error: "No se pudo reenviar el mail." };
  }
}

export async function extenderVencimiento(eventoId: string, dias: number) {
  const supabase = crearClienteAdmin();

  const { data: codigoAcceso } = await supabase
    .from("codigos_acceso")
    .select("*")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!codigoAcceso) return { error: "No encontramos el código de este evento." };

  const nuevaFecha = new Date(
    new Date(codigoAcceso.expira_en).getTime() + dias * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: errorExtender } = await supabase
    .from("codigos_acceso")
    .update({ expira_en: nuevaFecha, aviso_vencimiento_enviado: false })
    .eq("id", codigoAcceso.id);

  if (errorExtender) {
    console.error("Error al extender vencimiento:", errorExtender);
    return { error: "No se pudo extender el vencimiento." };
  }

  // Si se había marcado vencido, lo reabrimos.
  await supabase
    .from("eventos")
    .update({ estado: "fotos_subidas" })
    .eq("id", eventoId)
    .eq("estado", "vencido");

  revalidatePath(`/admin/eventos/${eventoId}`);
}
