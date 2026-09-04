import { NextResponse } from "next/server";
import { obtenerConfiguracion } from "@/lib/db/configuracion";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cupon = typeof body?.cupon === "string" ? body.cupon.trim().toUpperCase() : "";

  if (!cupon) {
    return NextResponse.json({ valido: false });
  }

  const [codigoDescuento, descuentoPorcentaje] = await Promise.all([
    obtenerConfiguracion("codigo_descuento"),
    obtenerConfiguracion("descuento_porcentaje"),
  ]);

  if (!codigoDescuento || cupon !== codigoDescuento.toUpperCase()) {
    return NextResponse.json({ valido: false });
  }

  return NextResponse.json({
    valido: true,
    porcentaje: parseInt(descuentoPorcentaje ?? "0", 10),
  });
}
