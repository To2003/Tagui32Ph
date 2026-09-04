import "server-only";
import { Resend } from "resend";
import { formatearFecha, formatearFechaHora, formatearPrecio } from "@/lib/fecha";
import type { Evento } from "@/lib/db/tipos";

// Instanciado recién al enviar (no al importar el módulo), para que el build
// no rompa mientras RESEND_API_KEY no esté configurada todavía.
function clienteResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.MAIL_FROM!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

function layout(tituloInterno: string, cuerpoHtml: string) {
  return `
  <div style="background:#0a0a0a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#141414;border-radius:8px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #262626;">
        <span style="font-size:20px;font-weight:bold;letter-spacing:0.05em;color:#f5f5f5;">
          TAGUI<span style="color:#e8a13c;">32</span>
        </span>
      </div>
      <div style="padding:24px;color:#e5e5e5;font-size:15px;line-height:1.6;">
        ${cuerpoHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #262626;color:#737373;font-size:12px;">
        Tagui32 — Fotografía deportiva
      </div>
    </div>
  </div>`;
}

function boton(href: string, texto: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:12px 20px;background:#e8a13c;color:#171310;font-weight:bold;text-decoration:none;border-radius:6px;">${texto}</a>`;
}

export async function enviarMailNuevaSolicitud(evento: Evento) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await clienteResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Nueva solicitud — ${evento.equipo} (${evento.deporte})`,
    html: layout(
      "Nueva solicitud",
      `
      <p><strong>Nueva solicitud de cobertura.</strong></p>
      <p>
        Equipo: <strong>${evento.equipo}</strong><br/>
        Deporte: ${evento.deporte}<br/>
        Fecha: ${formatearFechaHora(evento.fecha_partido)}<br/>
        Lugar: ${evento.lugar}<br/>
        Contacto: ${evento.contacto_nombre} — ${evento.contacto_email} — ${evento.contacto_whatsapp}
      </p>
      ${boton(`${BASE_URL}/admin/eventos/${evento.id}`, "Ver en el panel")}
      `
    ),
  });
}

export async function enviarMailSolicitudRecibida(evento: Evento) {
  await clienteResend().emails.send({
    from: FROM,
    to: evento.contacto_email,
    subject: "Recibimos tu solicitud — Tagui32",
    html: layout(
      "Solicitud recibida",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Recibimos tu solicitud de cobertura para <strong>${evento.equipo}</strong>
      el ${formatearFechaHora(evento.fecha_partido)} en ${evento.lugar}.</p>
      <p>Te confirmamos a la brevedad por acá o por WhatsApp. Cualquier cosa,
      respondé este mail.</p>
      `
    ),
  });
}

export async function enviarMailConfirmacion(evento: Evento) {
  await clienteResend().emails.send({
    from: FROM,
    to: evento.contacto_email,
    subject: `Confirmamos tu cobertura — ${evento.equipo}`,
    html: layout(
      "Cobertura confirmada",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Confirmamos la cobertura de <strong>${evento.equipo}</strong> el
      ${formatearFechaHora(evento.fecha_partido)} en ${evento.lugar}.</p>
      <p>Precio del pack: <strong>${formatearPrecio(evento.precio_centavos)}</strong>.
      Después del partido te vamos a mandar un código de acceso para ver y
      comprar las fotos.</p>
      <p>¡Nos vemos en la cancha!</p>
      `
    ),
  });
}

export async function enviarMailFotosListas(
  evento: Evento,
  codigo: string,
  expiraEn: string
) {
  await clienteResend().emails.send({
    from: FROM,
    to: evento.contacto_email,
    subject: `Ya están tus fotos — ${evento.equipo}`,
    html: layout(
      "Fotos listas",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Ya subimos las fotos de <strong>${evento.equipo}</strong>. Tu código
      de acceso es:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:0.1em;color:#e8a13c;margin:16px 0;">
        ${codigo}
      </p>
      <p>Precio del pack: <strong>${formatearPrecio(evento.precio_centavos)}</strong>.
      El código vence el <strong>${formatearFecha(expiraEn)}</strong> — después
      de esa fecha las fotos se eliminan, así que no lo dejes pasar.</p>
      ${boton(`${BASE_URL}/galeria/${codigo}`, "Ver mis fotos")}
      `
    ),
  });
}

export async function enviarMailAvisoVencimiento(evento: Evento, codigo: string, expiraEn: string) {
  await clienteResend().emails.send({
    from: FROM,
    to: evento.contacto_email,
    subject: `Tu código vence pronto — ${evento.equipo}`,
    html: layout(
      "Aviso de vencimiento",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Todavía no compraste el pack de <strong>${evento.equipo}</strong> y tu
      código vence el <strong>${formatearFecha(expiraEn)}</strong>. Después de
      esa fecha las fotos se eliminan y no vas a poder acceder más.</p>
      ${boton(`${BASE_URL}/galeria/${codigo}`, "Ver mis fotos")}
      `
    ),
  });
}

export async function enviarMailPagoConfirmado(evento: Evento, codigo: string) {
  await clienteResend().emails.send({
    from: FROM,
    to: evento.contacto_email,
    subject: `Pago confirmado — ${evento.equipo}`,
    html: layout(
      "Pago confirmado",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Recibimos tu pago del pack de <strong>${evento.equipo}</strong>. Ya
      podés descargar todas las fotos en original desde la galería.</p>
      ${boton(`${BASE_URL}/galeria/${codigo}`, "Descargar mis fotos")}
      `
    ),
  });
}
