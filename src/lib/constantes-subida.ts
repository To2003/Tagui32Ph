// Compartido entre cliente y servidor — por eso no vive en r2.ts (server-only).
export const TAMANO_PARTE_MULTIPART = 20 * 1024 * 1024; // 20MB
export const UMBRAL_MULTIPART = TAMANO_PARTE_MULTIPART;
