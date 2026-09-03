// Genera la preview con marca de agua en el navegador. Nunca se procesan
// imágenes en el servidor (spec sección 3): esto corre 100% client-side
// antes de subir a R2.

const ANCHO_MAXIMO = 1200;
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

export async function generarPreview(
  archivo: File
): Promise<{ blob: Blob; ancho: number; alto: number }> {
  const bitmap = await createImageBitmap(archivo);

  const ancho = Math.min(ANCHO_MAXIMO, bitmap.width);
  const alto = Math.round(bitmap.height * (ancho / bitmap.width));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");

  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  dibujarMarcaDeAgua(ctx, ancho, alto);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG)
  );
  if (!blob) throw new Error("No se pudo generar la preview");

  return { blob, ancho, alto };
}
