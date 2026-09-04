// Genera imágenes en el navegador. Nunca se procesan imágenes en el servidor
// (spec sección 3): todo esto corre client-side antes de subir a R2.

const CALIDAD_JPEG = 0.7;

function dibujarMarcaDeAgua(ctx: CanvasRenderingContext2D, ancho: number, alto: number) {
  ctx.save();
  ctx.translate(ancho / 2, alto / 2);
  ctx.rotate((-30 * Math.PI) / 180);
  ctx.translate(-ancho / 2, -alto / 2);

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "bold 32px sans-serif";
  ctx.textBaseline = "middle";

  // Cubrimos un área más grande que el canvas para que la rotación no deje
  // huecos sin marca en las esquinas.
  const diagonal = Math.sqrt(ancho ** 2 + alto ** 2);
  const pasoX = 260;
  const pasoY = 160;

  for (let y = -diagonal; y < diagonal; y += pasoY) {
    for (let x = -diagonal; x < diagonal; x += pasoX) {
      ctx.fillText("Tagui32", x, y);
    }
  }
  ctx.restore();
}

async function redimensionar(
  archivo: File,
  anchoMaximo: number,
  conMarcaDeAgua: boolean
): Promise<{ blob: Blob; ancho: number; alto: number }> {
  const bitmap = await createImageBitmap(archivo);

  const ancho = Math.min(anchoMaximo, bitmap.width);
  const alto = Math.round(bitmap.height * (ancho / bitmap.width));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");

  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  if (conMarcaDeAgua) dibujarMarcaDeAgua(ctx, ancho, alto);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG)
  );
  if (!blob) throw new Error("No se pudo generar la imagen");

  return { blob, ancho, alto };
}

// Preview con marca de agua para las fotos de un evento — 1200px de ancho.
export function generarPreview(archivo: File) {
  return redimensionar(archivo, 1200, true);
}

// Cualquier imagen que se muestra a tamaño completo sin marca de agua
// (portfolio, fotos de "Sobre mí") — 1600px de ancho.
export function generarImagenSinMarca(archivo: File) {
  return redimensionar(archivo, 1600, false);
}
