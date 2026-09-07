"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { calcularPrecioCentavos, obtenerConfiguracion } from "@/lib/db/configuracion";
import { solicitudSchema, type SolicitudOutput } from "@/lib/validaciones/agendar";
import { combinarFechaHoraArgentina } from "@/lib/fecha";
import { enviarMailAlertaFormularioPausado } from "@/lib/mail";
import { obtenerIp, hashearIp, verificarLimiteIp, registrarIntento } from "@/lib/rate-limit";
import { verificarTurnstile } from "@/lib/turnstile";

const LIMITE_GLOBAL_24H = 50;
const MENSAJE_ERROR_GENERICO = "No pudimos procesar tu solicitud. Probá de nuevo en un rato.";

// Si en las últimas 24hs se pasó de 50 solicitudes, pausamos el formulario
// solos y mandamos un único mail de alerta — no uno por cada intento de más.
async function chequearFrenoGlobal() {
  const supabase = crearClienteAdmin();
  const haceUnDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("eventos")
    .select("*", { count: "exact", head: true })
    .gte("created_at", haceUnDia);

  if ((count ?? 0) < LIMITE_GLOBAL_24H) return;

  // Update condicional: solo la request que efectivamente prende la pausa
  // (falso -> verdadero) manda el mail. Las demás, aunque también crucen el
  // umbral, encuentran el valor ya en "true" y no hacen nada más.
  const { data } = await supabase
    .from("configuracion")
    .update({ valor: "true" })
    .eq("clave", "formulario_pausado")
    .eq("valor", "false")
    .select();

  if (data && data.length > 0) {
    try {
      await enviarMailAlertaFormularioPausado(count ?? 0);
    } catch (err) {
      console.error("Error al mandar el mail de alerta de freno global:", err);
    }
  }
}

export async function crearSolicitud(input: SolicitudOutput, turnstileToken: string) {
  const headersList = await headers();
  const ip = obtenerIp(headersList);
  const ipHash = hashearIp(ip);

  // Honeypot: un bot completa todos los campos, incluido este que está
  // oculto para una persona. Si viene con contenido, fingimos éxito.
  if (input.sitioWeb) {
    console.log("Honeypot activado — solicitud descartada en silencio. IP hash:", ipHash);
    redirect("/agendar/gracias");
  }

  // Freno de mano global.
  const pausado = await obtenerConfiguracion("formulario_pausado");
  if (pausado === "true") {
    return { error: "El formulario está temporalmente cerrado. Escribinos por WhatsApp." };
  }

  // Rate limit por IP — antes de tocar la base con nada más.
  const { permitido } = await verificarLimiteIp(ipHash);
  if (!permitido) {
    return { error: "Recibimos varias solicitudes desde tu conexión. Probá de nuevo más tarde." };
  }

  const parsed = solicitudSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá los datos del formulario." };
  }
  const datos = parsed.data;

  const esHumano = await verificarTurnstile(turnstileToken, ip);
  if (!esHumano) {
    return { error: "No pudimos verificar que sos una persona. Recargá la página y probá de nuevo." };
  }

  await registrarIntento(ipHash);

  const precioCentavos = await calcularPrecioCentavos(datos.duracionHoras);
  const supabase = crearClienteAdmin();

  const { data: evento, error } = await supabase
    .from("eventos")
    .insert({
      deporte: datos.deporte,
      equipo: datos.equipo,
      fecha_partido: combinarFechaHoraArgentina(datos.fecha, datos.hora),
      lugar: datos.lugar,
      duracion_horas: datos.duracionHoras,
      cantidad_jugadores: datos.cantidadJugadores,
      notas: datos.notas || null,
      contacto_nombre: datos.contactoNombre,
      contacto_email: datos.contactoEmail,
      contacto_whatsapp: datos.contactoWhatsapp,
      precio_centavos: precioCentavos,
    })
    .select()
    .single();

  if (error || !evento) {
    console.error("Error al crear solicitud:", error);
    return { error: MENSAJE_ERROR_GENERICO };
  }

  // No mandamos mails acá: al admin le llega un resumen agrupado cada 30
  // minutos (cron /api/cron/notificar-solicitudes) y al solicitante recién
  // cuando el admin confirma la cobertura (enviarMailConfirmacion).
  await chequearFrenoGlobal();

  redirect("/agendar/gracias");
}
