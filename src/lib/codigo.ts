import "server-only";

// Sin I, O, 0, 1 — se confunden al dictarlos por WhatsApp.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generarCodigo(longitud = 8) {
  const bytes = new Uint32Array(longitud);
  crypto.getRandomValues(bytes);
  let codigo = "";
  for (let i = 0; i < longitud; i++) {
    codigo += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return codigo;
}
