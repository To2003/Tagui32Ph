"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { guardarConfiguracion } from "@/lib/db/configuracion";

export async function guardarConfig(formData: FormData) {
  const precioBase = Math.round(parseFloat(String(formData.get("precioBase") ?? "0")) * 100);
  const precioPorHora = Math.round(
    parseFloat(String(formData.get("precioPorHora") ?? "0")) * 100
  );
  const horasIncluidas = parseFloat(String(formData.get("horasIncluidas") ?? "1"));
  const deportes = String(formData.get("deportesDisponibles") ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .join(", ");

  const error = await guardarConfiguracion({
    precio_base_centavos: String(precioBase || 0),
    precio_por_hora_centavos: String(precioPorHora || 0),
    horas_incluidas: String(horasIncluidas > 0 ? horasIncluidas : 1),
    contacto_email: String(formData.get("contactoEmail") ?? ""),
    contacto_whatsapp: String(formData.get("contactoWhatsapp") ?? ""),
    deportes_disponibles: deportes,
    terminos_texto: String(formData.get("terminosTexto") ?? ""),
  });

  if (error) {
    console.error("Error al guardar configuración:", error);
  }

  revalidatePath("/admin/config");
  revalidatePath("/");
  revalidatePath("/agendar");
  revalidatePath("/terminos");
  redirect("/admin/config?guardado=1");
}

export async function crearCupon(formData: FormData) {
  const codigo = String(formData.get("codigoDescuento") ?? "").trim().toUpperCase();
  const porcentaje = parseInt(String(formData.get("descuentoPorcentaje") ?? "0"), 10);

  if (!codigo || !Number.isFinite(porcentaje) || porcentaje <= 0) {
    redirect("/admin/config");
  }

  await guardarConfiguracion({
    codigo_descuento: codigo,
    descuento_porcentaje: String(Math.min(100, Math.max(0, porcentaje))),
    descuento_activo: "true",
  });

  revalidatePath("/admin/config");
  redirect("/admin/config");
}

export async function alternarCupon(activo: boolean) {
  await guardarConfiguracion({ descuento_activo: String(activo) });
  revalidatePath("/admin/config");
}

export async function eliminarCupon() {
  await guardarConfiguracion({
    codigo_descuento: "",
    descuento_porcentaje: "0",
    descuento_activo: "false",
  });
  revalidatePath("/admin/config");
}
