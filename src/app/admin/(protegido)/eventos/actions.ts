"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { enviarMailConfirmacion, enviarMailPagoConfirmado } from "@/lib/mail";
import type { Evento } from "@/lib/db/tipos";

export async function confirmarEvento(eventoId: string) {
  const supabase = crearClienteAdmin();

  const { data: evento, error } = await supabase
    .from("eventos")
    .update({ estado: "confirmado" })
    .eq("id", eventoId)
    .eq("estado", "pendiente")
    .select()
    .single();

  if (error || !evento) {
    console.error("Error al confirmar evento:", error);
    return;
  }

  try {
    await enviarMailConfirmacion(evento as Evento);
  } catch (err) {
    // El evento ya quedó confirmado en la base; que falle el mail no
    // debería bloquear la confirmación.
    console.error("Error al mandar el mail de confirmación:", err);
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventoId}`);
}

export async function actualizarPrecio(eventoId: string, precioCentavos: number) {
  if (!Number.isFinite(precioCentavos) || precioCentavos <= 0) {
    return { error: "Precio inválido." };
  }

  const supabase = crearClienteAdmin();
  const { error } = await supabase
    .from("eventos")
    .update({ precio_centavos: Math.round(precioCentavos) })
    .eq("id", eventoId);

  if (error) {
    return { error: "No se pudo actualizar el precio." };
  }

  revalidatePath(`/admin/eventos/${eventoId}`);
}

// Red de contención para cuando el webhook de Mercado Pago falla o se
// pierde una notificación: el admin habilita la descarga a mano. Queda
// registrado en `pagos` como override manual (mp_payment_id con prefijo
// "manual-" en vez de un ID real de MP) para distinguirlo de un pago
// verificado de verdad.
export async function marcarPagoManual(eventoId: string) {
  const supabase = crearClienteAdmin();

  // Update condicional: solo se puede marcar a mano un evento que ya tiene
  // las fotos subidas y todavía no está pagado — evita doble ejecución y
  // usarlo en un estado que no corresponde.
  const { data: evento, error } = await supabase
    .from("eventos")
    .update({ estado: "pagado" })
    .eq("id", eventoId)
    .eq("estado", "fotos_subidas")
    .select()
    .single();

  if (error || !evento) {
    return { error: "No se pudo marcar el pago. Refrescá la página e intentá de nuevo." };
  }

  const { error: errorPago } = await supabase.from("pagos").insert({
    evento_id: eventoId,
    mp_payment_id: `manual-${eventoId}-${Date.now()}`,
    monto_centavos: (evento as Evento).precio_centavos,
    estado: "approved",
    payload: { motivo: "pago_manual_admin", marcado_en: new Date().toISOString() },
  });

  if (errorPago) {
    // El evento ya quedó pagado y la descarga habilitada; que falle el
    // registro de auditoría no debería revertir eso.
    console.error("Error al registrar el pago manual en `pagos`:", errorPago);
  }

  const { data: codigoAcceso } = await supabase
    .from("codigos_acceso")
    .select("codigo")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (codigoAcceso) {
    try {
      await enviarMailPagoConfirmado(evento as Evento, codigoAcceso.codigo);
    } catch (err) {
      console.error("Error al mandar el mail de pago manual:", err);
    }
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventoId}`);

  return { ok: true };
}

export async function rechazarEvento(eventoId: string) {
  const supabase = crearClienteAdmin();

  const { error } = await supabase
    .from("eventos")
    .update({ estado: "rechazado" })
    .eq("id", eventoId)
    .eq("estado", "pendiente");

  if (error) {
    console.error("Error al rechazar evento:", error);
    return;
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventoId}`);
}
