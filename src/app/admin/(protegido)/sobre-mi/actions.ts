"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearUrlSubida } from "@/lib/r2";
import { guardarConfiguracion } from "@/lib/db/configuracion";

export async function crearUrlSubidaSobreMi(contentType: string) {
  const key = `sobre-mi/${crypto.randomUUID()}.jpg`;
  const url = await crearUrlSubida(key, contentType);
  return { key, url };
}

export async function guardarImagenSobreMi(campo: "sobre_mi_foto_key" | "sobre_mi_camara_key", key: string) {
  await guardarConfiguracion({ [campo]: key });
  revalidatePath("/admin/sobre-mi");
  revalidatePath("/sobre-mi");
}

export async function guardarTextosSobreMi(formData: FormData) {
  await guardarConfiguracion({
    sobre_mi_bio: String(formData.get("bio") ?? ""),
    sobre_mi_hobbies: String(formData.get("hobbies") ?? ""),
    sobre_mi_camara_texto: String(formData.get("camaraTexto") ?? ""),
    sobre_mi_programador_texto: String(formData.get("programadorTexto") ?? ""),
    sobre_mi_programador_link: String(formData.get("programadorLink") ?? ""),
  });

  revalidatePath("/admin/sobre-mi");
  revalidatePath("/sobre-mi");
  redirect("/admin/sobre-mi?guardado=1");
}
