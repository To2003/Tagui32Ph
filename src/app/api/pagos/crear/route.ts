import { NextResponse, after } from "next/server";
import { validarCodigo } from "@/lib/db/galeria";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearPreferencia } from "@/lib/mercadopago";
import { validarCuponDescuento } from "@/lib/db/configuracion";
import { enviarMailPagoConfirmado } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

// Cupón del 100%: no hay nada que cobrarle a Mercado Pago (de hecho su API
// rechaza una preferencia con unit_price 0). Habilitamos directo, con el
// mismo patrón de update condicional que usa el webhook para no duplicar
// el mail si por algún motivo se llama dos veces.
async function canjearCuponGratis(evento: Evento, codigo: string) {
  const supabase = crearClienteAdmin();

  const { data: eventoActualizado } = await supabase
    .from("eventos")
    .update({ estado: "pagado" })
    .eq("id", evento.id)
    .neq("estado", "pagado")
    .select()
    .maybeSingle();

  if (eventoActualizado) {
    await supabase.from("pagos").insert({
      evento_id: evento.id,
      mp_payment_id: `cupon-${evento.id}`,
      monto_centavos: 0,
      estado: "approved",
      payload: { motivo: "cupon_100_por_ciento" },
    });

    after(async () => {
      try {
        await enviarMailPagoConfirmado(eventoActualizado as Evento, codigo);
      } catch (err) {
        console.error("Error al mandar el mail de canje con cupón:", err);
      }
    });
  }

  return `${BASE_URL}/galeria/exito?external_reference=${evento.id}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const codigo = typeof body?.codigo === "string" ? body.codigo.toUpperCase() : null;
  const cupon = typeof body?.cupon === "string" ? body.cupon.trim().toUpperCase() : "";

  if (!codigo) {
    return NextResponse.json({ error: "Falta el código." }, { status: 400 });
  }

  const resultado = await validarCodigo(codigo);
  if (!resultado.ok) {
    return NextResponse.json(
      { error: resultado.motivo === "vencido" ? "Ese código venció." : "Código inválido." },
      { status: 404 }
    );
  }

  const supabase = crearClienteAdmin();
  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", resultado.codigoAcceso.evento_id)
    .maybeSingle();

  if (!evento) {
    return NextResponse.json({ error: "No encontramos el evento." }, { status: 404 });
  }
  if ((evento as Evento).estado === "pagado") {
    return NextResponse.json({ error: "Este pack ya está pagado." }, { status: 400 });
  }

  let precioFinalCentavos = (evento as Evento).precio_centavos;

  if (cupon) {
    const resultadoCupon = await validarCuponDescuento(cupon);
    if (!resultadoCupon.valido) {
      return NextResponse.json({ error: "Ese cupón no es válido." }, { status: 400 });
    }

    precioFinalCentavos = Math.round(
      (evento as Evento).precio_centavos * (1 - resultadoCupon.porcentaje / 100)
    );
  }

  if (precioFinalCentavos <= 0) {
    const url = await canjearCuponGratis(evento as Evento, codigo);
    return NextResponse.json({ url });
  }

  try {
    const url = await crearPreferencia(evento as Evento, precioFinalCentavos);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error al crear preferencia de Mercado Pago:", err);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Probá de nuevo." }, { status: 500 });
  }
}
