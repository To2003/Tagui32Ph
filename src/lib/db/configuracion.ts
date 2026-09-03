import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export async function obtenerConfiguracion(clave: string) {
  const supabase = crearClienteAdmin();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", clave)
    .maybeSingle();

  return data?.valor ?? null;
}

export async function obtenerPrecioBaseCentavos() {
  const valor = await obtenerConfiguracion("precio_base_centavos");
  return valor ? parseInt(valor, 10) : 1500000;
}
