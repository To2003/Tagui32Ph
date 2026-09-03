import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import type { Evento } from "@/lib/db/tipos";
import { formatearFecha } from "@/lib/fecha";

function cliente() {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export async function crearPreferencia(evento: Evento) {
  const preference = new Preference(cliente());

  const resultado = await preference.create({
    body: {
      items: [
        {
          id: evento.id,
          title: `Pack de fotos — ${evento.equipo} — ${formatearFecha(evento.fecha_partido)}`,
          quantity: 1,
          unit_price: evento.precio_centavos / 100,
          currency_id: "ARS",
        },
      ],
      external_reference: evento.id,
      notification_url: `${BASE_URL}/api/pagos/webhook`,
      back_urls: {
        success: `${BASE_URL}/galeria/exito`,
        failure: `${BASE_URL}/galeria/error`,
        pending: `${BASE_URL}/galeria/pendiente`,
      },
      auto_return: "approved",
    },
  });

  const url = resultado.init_point ?? resultado.sandbox_init_point;
  if (!url) throw new Error("Mercado Pago no devolvió una URL de checkout");
  return url;
}

export async function obtenerPago(paymentId: string) {
  const payment = new Payment(cliente());
  return payment.get({ id: paymentId });
}

// La constraint de la tabla `pagos` solo admite estos 4 valores. Mapeamos
// el resto de los estados que puede devolver MP a su equivalente más
// cercano, para no romper el insert por un estado que no contemplamos.
export function mapearEstadoPago(
  status: string | undefined
): "approved" | "pending" | "rejected" | "refunded" {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      // pending, in_process, authorized, in_mediation, etc.
      return "pending";
  }
}
