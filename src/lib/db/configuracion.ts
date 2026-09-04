import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export type Configuracion = {
  precio_base_centavos: string;
  precio_por_hora_centavos: string;
  horas_incluidas: string;
  contacto_email: string;
  contacto_whatsapp: string;
  codigo_descuento: string;
  descuento_porcentaje: string;
  descuento_activo: string;
  deportes_disponibles: string;
  terminos_texto: string;
  sobre_mi_foto_key: string;
  sobre_mi_bio: string;
  sobre_mi_hobbies: string;
  sobre_mi_camara_key: string;
  sobre_mi_camara_texto: string;
  sobre_mi_programador_texto: string;
  sobre_mi_programador_link: string;
};

const VALORES_POR_DEFECTO: Configuracion = {
  precio_base_centavos: "1500000",
  precio_por_hora_centavos: "500000",
  horas_incluidas: "1",
  contacto_email: "hola@tagui32.com",
  contacto_whatsapp: "5490000000000",
  codigo_descuento: "",
  descuento_porcentaje: "0",
  descuento_activo: "false",
  deportes_disponibles: "Fútbol, Básquet, Vóley, Rugby, Hockey, Otro",
  terminos_texto: "Términos y condiciones pendientes de redactar.",
  sobre_mi_foto_key: "",
  sobre_mi_bio: "",
  sobre_mi_hobbies: "",
  sobre_mi_camara_key: "",
  sobre_mi_camara_texto: "",
  sobre_mi_programador_texto: "",
  sobre_mi_programador_link: "",
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

export function parsearDeportes(valor: string) {
  return valor
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export async function obtenerDeportesDisponibles() {
  const config = await obtenerConfiguracionCompleta();
  return parsearDeportes(config.deportes_disponibles);
}

// Precio base cubre `horas_incluidas`; lo que pasa de ahí se cobra por hora
// (proporcional, no redondea a la hora completa).
export async function calcularPrecioCentavos(duracionHoras: number) {
  const config = await obtenerConfiguracionCompleta();
  const precioBase = parseInt(config.precio_base_centavos, 10);
  const precioPorHora = parseInt(config.precio_por_hora_centavos, 10);
  const horasIncluidas = parseFloat(config.horas_incluidas);

  const horasExtra = Math.max(0, duracionHoras - horasIncluidas);
  return precioBase + Math.round(horasExtra * precioPorHora);
}

export async function validarCuponDescuento(
  cuponIngresado: string
): Promise<{ valido: false } | { valido: true; porcentaje: number }> {
  const cupon = cuponIngresado.trim().toUpperCase();
  if (!cupon) return { valido: false };

  const config = await obtenerConfiguracionCompleta();
  if (
    config.descuento_activo !== "true" ||
    !config.codigo_descuento ||
    cupon !== config.codigo_descuento.toUpperCase()
  ) {
    return { valido: false };
  }

  return { valido: true, porcentaje: parseInt(config.descuento_porcentaje, 10) };
}
