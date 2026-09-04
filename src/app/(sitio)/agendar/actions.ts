"use server";

import { redirect } from "next/navigation";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { calcularPrecioCentavos } from "@/lib/db/configuracion";
import { solicitudSchema, type SolicitudOutput } from "@/lib/validaciones/agendar";
import { combinarFechaHoraArgentina } from "@/lib/fecha";
import { enviarMailNuevaSolicitud, enviarMailSolicitudRecibida } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

export async function crearSolicitud(input: SolicitudOutput) {
  const parsed = solicitudSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisá los datos del formulario." };
  }
  const datos = parsed.data;

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
    return { error: "No pudimos guardar tu solicitud. Probá de nuevo en un rato." };
  }

  await Promise.allSettled([
    enviarMailNuevaSolicitud(evento as Evento),
    enviarMailSolicitudRecibida(evento as Evento),
  ]);

  redirect("/agendar/gracias");
}
