import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_GALERIA = "tagui32_galeria";
const TREINTA_DIAS_SEGUNDOS = 30 * 24 * 60 * 60;

function firmar(codigo: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(codigo).digest("hex");
}

// Cookie firmada: "{codigo}.{hmac}". No es la fuente de verdad de acceso
// (eso lo valida siempre la página contra la base) — es solo para que
// volver a /galeria a secas no obligue a retipear el código.
export function firmarCookieGaleria(codigo: string) {
  return `${codigo}.${firmar(codigo)}`;
}

export function verificarCookieGaleria(valor: string | undefined): string | null {
  if (!valor) return null;
  const [codigo, firma] = valor.split(".");
  if (!codigo || !firma) return null;

  const esperada = firmar(codigo);
  const bufferA = Buffer.from(firma);
  const bufferB = Buffer.from(esperada);
  if (bufferA.length !== bufferB.length || !timingSafeEqual(bufferA, bufferB)) {
    return null;
  }
  return codigo;
}

export const OPCIONES_COOKIE_GALERIA = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: TREINTA_DIAS_SEGUNDOS,
  path: "/",
};
