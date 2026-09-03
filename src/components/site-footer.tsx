import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-heading tracking-wide text-foreground">
            TAGUI<span className="text-primary">32</span>
          </span>{" "}
          — Fotografía deportiva
        </p>
        <div className="flex gap-6">
          <Link href="/galeria" className="transition-colors hover:text-foreground">
            Ya me sacaron fotos
          </Link>
          <Link href="/terminos" className="transition-colors hover:text-foreground">
            Términos y condiciones
          </Link>
        </div>
      </div>
    </footer>
  );
}
