"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearUrlSubida } from "@/lib/r2";
import type { FotoPortfolio } from "@/lib/db/tipos";

export async function crearUrlSubidaPortfolio(contentType: string) {
  const key = `portfolio/${crypto.randomUUID()}.jpg`;
  const url = await crearUrlSubida(key, contentType);
  return { key, url };
}

export async function guardarFotoPortfolio(datos: {
  key: string;
  titulo: string;
  deporte: string;
  ancho: number;
  alto: number;
}) {
  const supabase = crearClienteAdmin();

  const { data: ultima } = await supabase
    .from("portfolio")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("portfolio").insert({
    imagen_key: datos.key,
    titulo: datos.titulo || null,
    deporte: datos.deporte || null,
    orden: (ultima?.orden ?? -1) + 1,
  });

  if (error) return { error: "No se pudo guardar la foto." };

  revalidatePath("/admin/portfolio");
  revalidatePath("/");
}

export async function alternarVisible(id: string, visible: boolean) {
  const supabase = crearClienteAdmin();
  await supabase.from("portfolio").update({ visible }).eq("id", id);
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
}

export async function eliminarFotoPortfolio(id: string) {
  const supabase = crearClienteAdmin();
  await supabase.from("portfolio").delete().eq("id", id);
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
}

export async function moverFotoPortfolio(id: string, direccion: "arriba" | "abajo") {
  const supabase = crearClienteAdmin();
  const { data: fotos } = await supabase
    .from("portfolio")
    .select("id, orden")
    .order("orden", { ascending: true });

  if (!fotos) return;

  const indice = fotos.findIndex((f) => f.id === id);
  const vecino = direccion === "arriba" ? indice - 1 : indice + 1;
  if (indice === -1 || vecino < 0 || vecino >= fotos.length) return;

  const actual = fotos[indice] as FotoPortfolio;
  const otro = fotos[vecino] as FotoPortfolio;

  await Promise.all([
    supabase.from("portfolio").update({ orden: otro.orden }).eq("id", actual.id),
    supabase.from("portfolio").update({ orden: actual.orden }).eq("id", otro.id),
  ]);

  revalidatePath("/admin/portfolio");
  revalidatePath("/");
}
