import "server-only";

// Único punto de verdad para la URL pública del sitio. En desarrollo cae a
// localhost por comodidad; en producción falla fuerte si falta o si quedó
// mal cargada — así este bug (mails/webhooks apuntando a localhost) no
// vuelve a pasar en silencio.
export function obtenerBaseUrl() {
  // Sin barra final — todo el resto del código concatena "${base}/algo" a
  // mano, así que una barra de más acá se traduce en "//algo" en cada link.
  const valor = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  // OJO: `next build` siempre corre con NODE_ENV=production, incluso local
  // — por eso NO alcanza como señal. VERCEL_ENV solo existe cuando el build
  // corre de verdad en la infraestructura de Vercel.
  const esProduccionReal = process.env.VERCEL_ENV === "production";

  if (!esProduccionReal) {
    return valor || "http://localhost:3000";
  }

  if (!valor) {
    throw new Error(
      "NEXT_PUBLIC_BASE_URL no está configurada en producción. Revisá las Environment Variables en Vercel."
    );
  }
  if (valor.includes("localhost")) {
    throw new Error(
      `NEXT_PUBLIC_BASE_URL está en "${valor}" en producción — tiene que ser el dominio real (https://taguiph.com).`
    );
  }

  return valor;
}
