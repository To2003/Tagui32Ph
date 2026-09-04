"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/agendar", label: "Agendar" },
  { href: "/galeria", label: "Galería" },
  { href: "/sobre-mi", label: "Sobre mí" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-2xl tracking-wide text-foreground"
          onClick={() => setOpen(false)}
        >
          TAGUI<span className="text-primary">32</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
                pathname === item.href && "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/agendar">Agendá tu cobertura</Link>
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <SheetHeader>
              <SheetTitle className="font-heading text-xl tracking-wide">
                TAGUI<span className="text-primary">32</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-2 py-3 text-lg uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
                    pathname === item.href && "text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-4" onClick={() => setOpen(false)}>
                <Link href="/agendar">Agendá tu cobertura</Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
