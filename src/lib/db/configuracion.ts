import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export type Configuracion = {
  precio_base_centavos: string;
  contacto_email: string;
  contacto_whatsapp: string;
  codigo_descuento: string;
  descuento_porcentaje: string;
  terminos_texto: string;
};

const VALORES_POR_DEFECTO: Configuracion = {
  precio_base_centavos: "1500000",
  contacto_email: "hola@tagui32.com",
  contacto_whatsapp: "5490000000000",
  codigo_descuento: "",
  descuento_porcentaje: "0",
  terminos_texto: "Términos y condiciones pendientes de redactar.",
};

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

export async function obtenerConfiguracionCompleta(): Promise<Configuracion> {
  const supabase = crearClienteAdmin();
  const { data } = await supabase.from("configuracion").select("clave, valor");

  const mapa = Object.fromEntries((data ?? []).map((f) => [f.clave, f.valor]));
  return { ...VALORES_POR_DEFECTO, ...mapa };
}

export async function guardarConfiguracion(valores: Partial<Configuracion>) {
  const supabase = crearClienteAdmin();
  const filas = Object.entries(valores).map(([clave, valor]) => ({ clave, valor: String(valor) }));
  const { error } = await supabase.from("configuracion").upsert(filas, { onConflict: "clave" });
  return error;
}
