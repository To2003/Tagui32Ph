export type EstadoEvento =
  | "pendiente"
  | "confirmado"
  | "rechazado"
  | "fotos_subidas"
  | "pagado"
  | "vencido";

export type Evento = {
  id: string;
  deporte: string;
  equipo: string;
  fecha_partido: string;
  lugar: string;
  duracion_horas: number | null;
  cantidad_jugadores: number | null;
  notas: string | null;
  contacto_nombre: string;
  contacto_email: string;
  contacto_whatsapp: string;
  estado: EstadoEvento;
  precio_centavos: number;
  zip_key: string | null;
  zip_bytes: number | null;
  created_at: string;
  updated_at: string;
};

export type Foto = {
  id: string;
  evento_id: string;
  preview_key: string;
  ancho: number | null;
  alto: number | null;
  orden: number;
  created_at: string;
};

export type CodigoAcceso = {
  id: string;
  evento_id: string;
  codigo: string;
  expira_en: string;
  usos: number;
  created_at: string;
};
