import { NextResponse } from "next/server";
import { validarCuponDescuento } from "@/lib/db/configuracion";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cupon = typeof body?.cupon === "string" ? body.cupon : "";

  const resultado = await validarCuponDescuento(cupon);
  return NextResponse.json(resultado);
}
