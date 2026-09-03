import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente atado a la sesión del usuario (cookies), respeta RLS.
// Se usa solo para la autenticación del admin (Supabase Auth), nunca
// para leer/escribir eventos, fotos, etc. — eso es siempre con
// crearClienteAdmin() en src/lib/supabase/admin.ts.
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component sin permiso de escritura;
            // el middleware ya se encarga de refrescar la sesión en ese caso.
          }
        },
      },
    }
  );
}
