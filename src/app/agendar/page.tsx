import type { Metadata } from "next";
import { AgendarForm } from "@/components/agendar-form";

export const metadata: Metadata = {
  title: "Agendá tu cobertura — Tagui32",
  description: "Contanos de tu partido y te confirmamos la cobertura fotográfica.",
};

export default function AgendarPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">
        Agendar cobertura
      </p>
      <h1 className="mt-4 font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
        Contanos de tu partido
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Completá los datos y te confirmamos la cobertura a la brevedad. El
        WhatsApp es importante: es la vía más rápida para avisar si el
        partido se suspende.
      </p>

      <div className="mt-12">
        <AgendarForm />
      </div>
    </div>
  );
}
