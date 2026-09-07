// fetch() no expone progreso de subida; XHR sí. Se usa para la barra de
// progreso al subir directo a R2 desde el navegador.
//
// Devuelve el ETag de la respuesta si está presente (lo necesitan las partes
// de un multipart upload para poder completarlo después). Para eso el bucket
// de R2 tiene que exponer el header en su política de CORS
// ("ExposeHeaders": ["ETag"]) — si no, el navegador no puede leerlo aunque
// la subida haya salido bien.
function intentarSubida(
  url: string,
  cuerpo: Blob | File,
  contentType: string,
  onProgress: (bytesSubidos: number) => void,
  signal?: AbortSignal
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);

    const onAbort = () => {
      xhr.abort();
      reject(new Error("cancelado"));
    };
    signal?.addEventListener("abort", onAbort);
    const limpiar = () => signal?.removeEventListener("abort", onAbort);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      limpiar();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(cuerpo.size);
        resolve(xhr.getResponseHeader("ETag"));
      } else if (xhr.status === 403) {
        reject(new Error("El link de subida venció. Volvé a intentar."));
      } else {
        reject(new Error(`La subida falló (código ${xhr.status}).`));
      }
    };
    xhr.onerror = () => {
      limpiar();
      reject(new Error("Se cortó la conexión durante la subida."));
    };

    xhr.send(cuerpo);
  });
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_INTENTOS = 3;

// Reintenta hasta 3 veces con backoff exponencial (2s, 4s) antes de tirar la
// toalla. Si se aborta a propósito (signal), no reintenta.
export async function subirArchivo(
  url: string,
  cuerpo: Blob | File,
  contentType: string,
  onProgress: (bytesSubidos: number) => void,
  signal?: AbortSignal
): Promise<string | null> {
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      return await intentarSubida(url, cuerpo, contentType, onProgress, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      if (intento === MAX_INTENTOS) {
        throw err instanceof Error
          ? err
          : new Error("No se pudo subir el archivo. Probá de nuevo.");
      }
      onProgress(0); // el intento fallido puede haber reportado progreso parcial
      await esperar(2 ** intento * 1000);
    }
  }
  throw new Error("No se pudo subir el archivo.");
}

// Ejecuta `trabajo` sobre cada item de `items`, con a lo sumo `limite` en
// paralelo — para no saturar la conexión subiendo todo a la vez.
export async function conConcurrenciaLimitada<T>(
  items: T[],
  limite: number,
  trabajo: (item: T, indice: number) => Promise<void>
) {
  let cursor = 0;
  async function siguiente(): Promise<void> {
    const indice = cursor++;
    if (indice >= items.length) return;
    await trabajo(items[indice], indice);
    return siguiente();
  }
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, siguiente));
}
