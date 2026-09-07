import "server-only";
import { Resend } from "resend";
import { formatearFecha, formatearFechaHora, formatearPrecio, ZONA_HORARIA } from "@/lib/fecha";
import { obtenerBaseUrl } from "@/lib/base-url";
import { obtenerConfiguracionCompleta, guardarConfiguracion } from "@/lib/db/configuracion";
import type { Evento } from "@/lib/db/tipos";

// Instanciado recién al enviar (no al importar el módulo), para que el build
// no rompa mientras RESEND_API_KEY no esté configurada todavía.
function clienteResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.MAIL_FROM!;

// Tope duro para que un bug o un ataque no nos deje mandando mails sin
// parar (y sin gastar de más en el plan de Resend). El contador vive en
// `configuracion` y se resetea solo al cambiar el día (horario argentino).
const TOPE_DIARIO_MAILS = 100;

function fechaHoyArgentina() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(new Date());
}

async function hayCupoDiario(): Promise<boolean> {
  const hoy = fechaHoyArgentina();
  const config = await obtenerConfiguracionCompleta();
  const enviadosHoy = config.mails_contador_fecha === hoy ? parseInt(config.mails_enviados_hoy, 10) : 0;

  if (enviadosHoy >= TOPE_DIARIO_MAILS) return false;

  await guardarConfiguracion({
    mails_contador_fecha: hoy,
    mails_enviados_hoy: String(enviadosHoy + 1),
  });
  return true;
}

async function enviarMail(opciones: { to: string; subject: string; html: string }) {
  if (!(await hayCupoDiario())) {
    const mensaje = `Tope diario de ${TOPE_DIARIO_MAILS} mails alcanzado — no se mandó "${opciones.subject}" a ${opciones.to}`;
    console.error(mensaje);
    throw new Error(mensaje);
  }
  await clienteResend().emails.send({ from: FROM, ...opciones });
}

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

export async function enviarMailAlertaFormularioPausado(cantidadUltimas24h: number) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await enviarMail({
    to: adminEmail,
    subject: "Che, pausé /agendar solo — llegaron muchas solicitudes",
    html: layout(
      "Formulario pausado",
      `
      <p>En las últimas 24 horas llegaron <strong>${cantidadUltimas24h}</strong>
      solicitudes de cobertura — bastantes más de lo normal, así que pausé el
      formulario de <strong>/agendar</strong> solo, por las dudas de que sea
      un ataque o un bot.</p>
      <p>Revisá el panel de eventos y, si está todo en orden, reactivalo
      vos mismo desde <strong>/admin/config</strong>.</p>
      ${boton(`${obtenerBaseUrl()}/admin/eventos`, "Ver eventos")}
      `
    ),
  });
}

// Resumen agrupado de solicitudes nuevas — se manda una sola vez cada 30
// minutos (vía cron) con todas las que llegaron en la tanda, en vez de un
// mail por solicitud.
export async function enviarMailResumenSolicitudes(eventos: Evento[]) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || eventos.length === 0) return;

  const plural = eventos.length > 1;
  const filas = eventos
    .map(
      (evento) => `
      <li style="margin-bottom:12px;">
        <strong>${evento.equipo}</strong> (${evento.deporte}) —
        ${formatearFechaHora(evento.fecha_partido)}<br/>
        ${evento.contacto_nombre} — ${evento.contacto_email} — ${evento.contacto_whatsapp}
      </li>`
    )
    .join("");

  await enviarMail({
    to: adminEmail,
    subject: `${eventos.length} solicitud${plural ? "es" : ""} nueva${plural ? "s" : ""} de cobertura`,
    html: layout(
      "Nuevas solicitudes",
      `
      <p>Llegaron <strong>${eventos.length}</strong> solicitud${plural ? "es" : ""}
      de cobertura nueva${plural ? "s" : ""}:</p>
      <ul style="padding-left:20px;margin:16px 0;">${filas}</ul>
      ${boton(`${obtenerBaseUrl()}/admin/eventos`, "Ver en el panel")}
      `
    ),
  });
}

export async function enviarMailConfirmacion(evento: Evento) {
  await enviarMail({
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
  await enviarMail({
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
      ${boton(`${obtenerBaseUrl()}/galeria/${codigo}`, "Ver mis fotos")}
      `
    ),
  });
}

export async function enviarMailAvisoVencimiento(evento: Evento, codigo: string, expiraEn: string) {
  await enviarMail({
    to: evento.contacto_email,
    subject: `Tu código vence pronto — ${evento.equipo}`,
    html: layout(
      "Aviso de vencimiento",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Todavía no compraste el pack de <strong>${evento.equipo}</strong> y tu
      código vence el <strong>${formatearFecha(expiraEn)}</strong>. Después de
      esa fecha las fotos se eliminan y no vas a poder acceder más.</p>
      ${boton(`${obtenerBaseUrl()}/galeria/${codigo}`, "Ver mis fotos")}
      `
    ),
  });
}

export async function enviarMailPagoConfirmado(evento: Evento, codigo: string) {
  await enviarMail({
    to: evento.contacto_email,
    subject: `Pago confirmado — ${evento.equipo}`,
    html: layout(
      "Pago confirmado",
      `
      <p>Hola ${evento.contacto_nombre},</p>
      <p>Recibimos tu pago del pack de <strong>${evento.equipo}</strong>. Ya
      podés descargar todas las fotos en original desde la galería.</p>
      ${boton(`${obtenerBaseUrl()}/galeria/${codigo}`, "Descargar mis fotos")}
      `
    ),
  });
}
