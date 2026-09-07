import { z } from "zod";

// El spam de enlaces es el más común en formularios abiertos — lo cortamos
// en cualquier campo de texto libre.
const CONTIENE_URL = /(https?:\/\/|www\.)/i;
const sinUrl = (valor: string) => !CONTIENE_URL.test(valor);
const MENSAJE_SIN_URL = "No se permiten links acá.";

export const solicitudSchema = z
  .object({
    deporte: z.string().min(1, "Elegí un deporte"),
    equipo: z
      .string()
      .trim()
      .min(2, "Contanos el nombre del equipo")
      .max(60, "Máximo 60 caracteres")
      .refine(sinUrl, MENSAJE_SIN_URL),
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
      .max(200)
      .refine(sinUrl, MENSAJE_SIN_URL),
    duracionHoras: z.coerce
      .number({ message: "Ingresá la duración estimada" })
      .min(0.5, "Mínimo media hora")
      .max(8, "Máximo 8 horas"),
    cantidadJugadores: z.coerce
      .number({ message: "Ingresá la cantidad de jugadores" })
      .int("Tiene que ser un número entero")
      .min(2, "Mínimo 2 jugadores")
      .max(50, "Máximo 50 jugadores"),
    notas: z
      .string()
      .trim()
      .max(500, "Máximo 500 caracteres")
      .refine((v) => sinUrl(v), MENSAJE_SIN_URL)
      .optional()
      .or(z.literal("")),
    contactoNombre: z
      .string()
      .trim()
      .min(2, "Decinos tu nombre")
      .max(60, "Máximo 60 caracteres")
      .refine(sinUrl, MENSAJE_SIN_URL),
    contactoEmail: z.string().trim().email("Ese email no parece válido").max(100),
    contactoWhatsapp: z
      .string()
      .trim()
      .min(8, "Ingresá un WhatsApp válido")
      .max(20)
      .regex(/^[\d\s+-]+$/, "Usá solo números, espacios, + y guiones"),
    // Honeypot: un campo que ningún humano completa (está oculto visualmente).
    // Si viene con contenido, la solicitud se descarta en el servidor.
    sitioWeb: z.string().optional(),
  })
  .refine(
    (datos) => {
      const fechaPartido = new Date(`${datos.fecha}T${datos.hora}:00-03:00`);
      if (Number.isNaN(fechaPartido.getTime())) return false;

      const en12Meses = new Date();
      en12Meses.setMonth(en12Meses.getMonth() + 12);

      return fechaPartido.getTime() >= Date.now() && fechaPartido <= en12Meses;
    },
    { message: "Elegí una fecha futura, dentro de los próximos 12 meses.", path: ["fecha"] }
  );

// Los inputs de tipo number pasan por z.coerce, así que el tipo de entrada
// del formulario (strings, antes de validar) difiere del tipo de salida
// (números, después de validar) — de ahí los dos tipos.
export type SolicitudInput = z.input<typeof solicitudSchema>;
export type SolicitudOutput = z.output<typeof solicitudSchema>;
