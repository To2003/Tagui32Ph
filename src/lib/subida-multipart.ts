import { subirArchivo, conConcurrenciaLimitada } from "@/lib/subida-cliente";
import {
  iniciarSubidaZip,
  completarSubidaZipMultipart,
  abortarSubidaZipMultipart,
} from "@/app/admin/(protegido)/eventos/[id]/upload-actions";
import { TAMANO_PARTE_MULTIPART } from "@/lib/constantes-subida";

const CONCURRENCIA_PARTES = 3;

function avisarAbortoAlCerrarPestana(key: string, uploadId: string) {
  const blob = new Blob([JSON.stringify({ key, uploadId })], { type: "application/json" });
  navigator.sendBeacon("/api/r2/abortar-multipart", blob);
}

// Sube el ZIP de originales. Si es chico, un PUT simple (con reintento);
// si es grande, multipart en partes de 20MB con hasta 3 en paralelo.
// `signal` permite cancelar a mano (botón) y también se usa para no
// reintentar si el usuario canceló a propósito.
export async function subirZip(
  archivo: File,
  eventoId: string,
  onProgress: (subido: number, total: number) => void,
  signal: AbortSignal
): Promise<{ key: string }> {
  const resultado = await iniciarSubidaZip(eventoId, archivo.type, archivo.size);

  if (resultado.modo === "simple") {
    await subirArchivo(
      resultado.url,
      archivo,
      archivo.type || "application/zip",
      (subido) => onProgress(subido, archivo.size),
      signal
    );
    return { key: resultado.key };
  }

  const { key, uploadId, partes } = resultado;

  // Best-effort: si cierra la pestaña a mitad de camino, avisamos para que
  // el servidor aborte el multipart y no queden partes huérfanas en R2.
  const onBeforeUnload = () => avisarAbortoAlCerrarPestana(key, uploadId);
  window.addEventListener("beforeunload", onBeforeUnload);

  const progresoPorParte = new Map<number, number>();
  const notificarProgreso = () => {
    const subido = Array.from(progresoPorParte.values()).reduce((a, b) => a + b, 0);
    onProgress(subido, archivo.size);
  };

  const partesSubidas: { numeroParte: number; etag: string }[] = [];

  try {
    await conConcurrenciaLimitada(partes, CONCURRENCIA_PARTES, async ({ numeroParte, url }) => {
      const inicio = (numeroParte - 1) * TAMANO_PARTE_MULTIPART;
      const fin = Math.min(inicio + TAMANO_PARTE_MULTIPART, archivo.size);
      const blobParte = archivo.slice(inicio, fin);

      const etag = await subirArchivo(
        url,
        blobParte,
        "",
        (bytes) => {
          progresoPorParte.set(numeroParte, bytes);
          notificarProgreso();
        },
        signal
      );

      if (!etag) {
        throw new Error(
          "No pudimos confirmar una parte de la subida (falta el header ETag). " +
            "Revisá que el bucket de R2 tenga \"ExposeHeaders\": [\"ETag\"] en su política de CORS."
        );
      }
      partesSubidas.push({ numeroParte, etag });
    });
  } catch (err) {
    await abortarSubidaZipMultipart(key, uploadId);
    if (signal.aborted) throw new Error("Subida cancelada.");
    throw err;
  } finally {
    window.removeEventListener("beforeunload", onBeforeUnload);
  }

  await completarSubidaZipMultipart(key, uploadId, partesSubidas);
  return { key };
}
