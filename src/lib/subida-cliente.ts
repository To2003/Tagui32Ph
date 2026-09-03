// fetch() no expone progreso de subida; XHR sí. Se usa para la barra de
// progreso al subir directo a R2 desde el navegador.
export function subirArchivo(
  url: string,
  cuerpo: Blob | File,
  contentType: string,
  onProgress: (bytesSubidos: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(cuerpo.size);
        resolve();
      } else {
        reject(new Error(`Subida falló con status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Error de red al subir el archivo"));

    xhr.send(cuerpo);
  });
}
