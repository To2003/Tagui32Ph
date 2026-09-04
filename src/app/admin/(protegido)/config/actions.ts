"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { guardarConfiguracion } from "@/lib/db/configuracion";

export async function guardarConfig(formData: FormData) {
  const precioBase = Math.round(parseFloat(String(formData.get("precioBase") ?? "0")) * 100);
  const descuentoPorcentaje = parseInt(String(formData.get("descuentoPorcentaje") ?? "0"), 10);

  const error = await guardarConfiguracion({
    precio_base_centavos: String(precioBase || 0),
    contacto_email: String(formData.get("contactoEmail") ?? ""),
    contacto_whatsapp: String(formData.get("contactoWhatsapp") ?? ""),
    codigo_descuento: String(formData.get("codigoDescuento") ?? "").trim().toUpperCase(),
    descuento_porcentaje: String(Math.min(100, Math.max(0, descuentoPorcentaje || 0))),
    terminos_texto: String(formData.get("terminosTexto") ?? ""),
  });

  if (error) {
    console.error("Error al guardar configuración:", error);
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  revalidatePath("/terminos");
  redirect("/admin/config?guardado=1");
}
