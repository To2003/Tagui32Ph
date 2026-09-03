import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export default async function AdminProtegidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin/eventos" className="font-heading text-xl tracking-wide">
            TAGUI<span className="text-primary">32</span>{" "}
            <span className="text-sm text-muted-foreground">admin</span>
          </Link>
          <form action={cerrarSesion}>
            <Button type="submit" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
