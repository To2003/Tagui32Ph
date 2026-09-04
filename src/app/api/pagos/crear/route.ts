import { NextResponse } from "next/server";
import { validarCodigo } from "@/lib/db/galeria";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearPreferencia } from "@/lib/mercadopago";
import { obtenerConfiguracion } from "@/lib/db/configuracion";
import type { Evento } from "@/lib/db/tipos";

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
    const [codigoDescuento, descuentoPorcentaje] = await Promise.all([
      obtenerConfiguracion("codigo_descuento"),
      obtenerConfiguracion("descuento_porcentaje"),
    ]);

    if (!codigoDescuento || cupon !== codigoDescuento.toUpperCase()) {
      return NextResponse.json({ error: "Ese cupón no es válido." }, { status: 400 });
    }

    const porcentaje = parseInt(descuentoPorcentaje ?? "0", 10);
    precioFinalCentavos = Math.round(
      (evento as Evento).precio_centavos * (1 - porcentaje / 100)
    );
  }

  try {
    const url = await crearPreferencia(evento as Evento, precioFinalCentavos);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error al crear preferencia de Mercado Pago:", err);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Probá de nuevo." }, { status: 500 });
  }
}
