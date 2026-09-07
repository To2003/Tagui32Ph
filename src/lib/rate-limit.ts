import "server-only";
import { createHash } from "crypto";
import { crearClienteAdmin } from "@/lib/supabase/admin";

const LIMITE_POR_HORA = 3;
const LIMITE_POR_DIA = 10;

export function obtenerIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "desconocida";
}

export function hashearIp(ip: string): string {
  return createHash("sha256")
    .update(ip + process.env.IP_HASH_SALT!)
    .digest("hex");
}

export async function verificarLimiteIp(ipHash: string): Promise<{ permitido: boolean }> {
  const supabase = crearClienteAdmin();
  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const haceUnDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: countHora }, { count: countDia }] = await Promise.all([
    supabase
      .from("intentos_solicitud")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", haceUnaHora),
    supabase
      .from("intentos_solicitud")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", haceUnDia),
  ]);

  if ((countHora ?? 0) >= LIMITE_POR_HORA || (countDia ?? 0) >= LIMITE_POR_DIA) {
    return { permitido: false };
  }
  return { permitido: true };
}

export async function registrarIntento(ipHash: string) {
  const supabase = crearClienteAdmin();
  await supabase.from("intentos_solicitud").insert({ ip_hash: ipHash });
}

export async function limpiarIntentosViejos() {
  const supabase = crearClienteAdmin();
  const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("intentos_solicitud").delete().lt("created_at", haceSieteDias);
  if (error) console.error("Error al limpiar intentos_solicitud:", error);
}
