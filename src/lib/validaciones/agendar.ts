import { z } from "zod";

export const solicitudSchema = z.object({
  deporte: z.string().min(1, "Elegí un deporte"),
  equipo: z
    .string()
    .trim()
    .min(2, "Contanos el nombre del equipo")
    .max(120),
  fecha: z
    .string()
    .min(1, "Elegí la fecha del partido")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hora: z
    .string()
    .min(1, "Elegí el horario")
    .regex(/^\d{2}:\d{2}$/, "Horario inválido"),
  lugar: z
    .string()
    .trim()
    .min(2, "Decinos dónde es el partido")
    .max(200),
  duracionHoras: z.coerce
    .number({ message: "Ingresá la duración estimada" })
    .min(0.5, "Mínimo media hora")
    .max(12, "Revisá la duración"),
  cantidadJugadores: z.coerce
    .number({ message: "Ingresá la cantidad de jugadores" })
    .int("Tiene que ser un número entero")
    .min(1, "Mínimo 1 jugador")
    .max(200, "Revisá la cantidad"),
  notas: z.string().trim().max(1000).optional().or(z.literal("")),
  contactoNombre: z
    .string()
    .trim()
    .min(2, "Decinos tu nombre")
    .max(120),
  contactoEmail: z.string().trim().email("Ese email no parece válido"),
  contactoWhatsapp: z
    .string()
    .trim()
    .min(6, "Ingresá un WhatsApp válido")
    .max(30)
    .regex(/^[\d\s+()-]+$/, "Usá solo números, espacios y +()-"),
});

// Los inputs de tipo number pasan por z.coerce, así que el tipo de entrada
// del formulario (strings, antes de validar) difiere del tipo de salida
// (números, después de validar) — de ahí los dos tipos.
export type SolicitudInput = z.input<typeof solicitudSchema>;
export type SolicitudOutput = z.output<typeof solicitudSchema>;
