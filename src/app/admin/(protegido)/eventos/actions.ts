"use server";

import { revalidatePath } from "next/cache";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { enviarMailConfirmacion } from "@/lib/mail";
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
