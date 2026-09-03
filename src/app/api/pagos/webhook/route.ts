import { NextResponse } from "next/server";
import { after } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { obtenerPago, mapearEstadoPago } from "@/lib/mercadopago";
import { enviarMailPagoConfirmado } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

function extraerPaymentId(url: URL, body: Record<string, unknown> | null): string | null {
  const data = body?.data as Record<string, unknown> | undefined;
  if (data?.id) return String(data.id);

  const idParam = url.searchParams.get("data.id") || url.searchParams.get("id");
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  if (idParam && (!topic || topic === "payment")) return idParam;

  return null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);
  const paymentId = extraerPaymentId(url, body);

  // No es una notificación de pago (ej. merchant_order) — no nos interesa, 200 igual.
  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  // Regla 1: nunca confiar en el payload. La verdad sale de consultar la API con nuestro token.
  let payment;
  try {
    payment = await obtenerPago(paymentId);
  } catch (err) {
    console.error("No se pudo consultar el pago en Mercado Pago:", err);
    return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 500 });
  }

  const eventoId = payment.external_reference;
  if (!eventoId) {
    console.error("Pago de MP sin external_reference:", paymentId);
    return NextResponse.json({ ok: true });
  }

  const supabase = crearClienteAdmin();
  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .maybeSingle();

  if (!evento) {
    console.error("Webhook de MP para un evento inexistente:", eventoId);
    return NextResponse.json({ ok: true });
  }

  const estadoPago = mapearEstadoPago(payment.status);
  const montoCentavos = Math.round((payment.transaction_amount ?? 0) * 100);

  // Regla 2: idempotencia por mp_payment_id. Usamos upsert (no insert simple)
  // porque un mismo pago puede pasar de "pending" a "approved" más tarde
  // (medios offline tipo Rapipago) y esa transición no puede perderse.
  const { error: errorUpsert } = await supabase.from("pagos").upsert(
    {
      evento_id: eventoId,
      mp_payment_id: String(paymentId),
      monto_centavos: montoCentavos,
      estado: estadoPago,
      payload: JSON.parse(JSON.stringify(payment)),
    },
    { onConflict: "mp_payment_id" }
  );

  if (errorUpsert) {
    console.error("Error al guardar el pago:", errorUpsert);
    return NextResponse.json({ error: "No se pudo registrar el pago" }, { status: 500 });
  }

  const montoEsperado = (evento as Evento).precio_centavos;
  const montoValido = montoCentavos === montoEsperado;

  if (estadoPago === "approved" && montoValido) {
    // Update condicional: solo el que efectivamente hace la transición manda el mail.
    // Evita duplicar el mail si llegan dos notificaciones casi al mismo tiempo.
    const { data: eventoActualizado } = await supabase
      .from("eventos")
      .update({ estado: "pagado" })
      .eq("id", eventoId)
      .neq("estado", "pagado")
      .select()
      .maybeSingle();

    if (eventoActualizado) {
      const { data: codigoAcceso } = await supabase
        .from("codigos_acceso")
        .select("codigo")
        .eq("evento_id", eventoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (codigoAcceso) {
        after(async () => {
          try {
            await enviarMailPagoConfirmado(eventoActualizado as Evento, codigoAcceso.codigo);
          } catch (err) {
            console.error("Error al mandar el mail de pago confirmado:", err);
          }
        });
      }
    }
  } else if (estadoPago === "approved" && !montoValido) {
    console.error(
      `Monto no coincide para evento ${eventoId}: pagó ${montoCentavos}, precio ${montoEsperado}. ` +
        `Pago ${paymentId} registrado pero NO se habilitó la descarga.`
    );
  }

  return NextResponse.json({ ok: true });
}
