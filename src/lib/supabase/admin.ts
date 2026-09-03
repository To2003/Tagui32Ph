import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la service_role key: bypassea RLS por completo.
// Úsalo SOLO en Server Actions, Route Handlers o Server Components.
// El paquete `server-only` hace fallar el build si esto se importa
// por error desde un componente cliente.
export function crearClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
