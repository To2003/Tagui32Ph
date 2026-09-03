const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export function formatearFechaHora(fechaIso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_HORARIA,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(fechaIso));
}

export function formatearFecha(fechaIso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_HORARIA,
    dateStyle: "long",
  }).format(new Date(fechaIso));
}

// Combina un date input (yyyy-mm-dd) y un time input (HH:mm) asumiendo
// siempre horario de Argentina (UTC-3 fijo, sin horario de verano),
// sin depender de la zona horaria del servidor donde corre el proceso.
export function combinarFechaHoraArgentina(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00-03:00`).toISOString();
}

export function formatearPrecio(centavos: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}
