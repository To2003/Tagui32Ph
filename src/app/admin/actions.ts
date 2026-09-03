"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function iniciarSesion(email: string, password: string) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect("/admin/eventos");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/admin");
}
