import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { abortarMultipart } from "@/lib/r2";

// Ruta aparte (no Server Action) porque `navigator.sendBeacon` — el único
// mecanismo confiable para avisar al cerrar la pestaña — necesita una URL
// común a la que pegarle, no puede invocar una Server Action.
export async function POST(request: Request) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : null;
  const uploadId = typeof body?.uploadId === "string" ? body.uploadId : null;

  if (!key || !uploadId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  await abortarMultipart(key, uploadId).catch((err) => {
    console.error("Error al abortar multipart (beacon):", err);
  });

  return NextResponse.json({ ok: true });
}
