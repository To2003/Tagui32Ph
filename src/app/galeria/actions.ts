"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validarCodigo } from "@/lib/db/galeria";
import { codigoSchema } from "@/lib/validaciones/codigo";
import { firmarCookieGaleria, COOKIE_GALERIA, OPCIONES_COOKIE_GALERIA } from "@/lib/sesion-galeria";

export async function ingresarCodigo(valorIngresado: string) {
  const parsed = codigoSchema.safeParse(valorIngresado);
  if (!parsed.success) {
    return { error: "Ingresá tu código." };
  }
  const codigo = parsed.data;

  const resultado = await validarCodigo(codigo);
  if (!resultado.ok) {
    if (resultado.motivo === "vencido") {
      return { error: "Che, ese código venció." };
    }
    return { error: "No encontramos ese código. Revisalo bien." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_GALERIA, firmarCookieGaleria(codigo), OPCIONES_COOKIE_GALERIA);

  redirect(`/galeria/${codigo}`);
}
