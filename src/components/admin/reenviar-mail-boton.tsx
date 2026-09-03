"use client";

import { useState, useTransition } from "react";
import { reenviarMailFotos } from "@/app/admin/(protegido)/eventos/[id]/upload-actions";
import { Button } from "@/components/ui/button";

export function ReenviarMailBoton({ eventoId }: { eventoId: string }) {
  const [estado, setEstado] = useState<"idle" | "enviado" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const reenviar = () => {
    startTransition(async () => {
      const resultado = await reenviarMailFotos(eventoId);
      setEstado(resultado?.error ? "error" : "enviado");
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={reenviar} disabled={isPending}>
        {isPending ? "Mandando..." : "Reenviar mail"}
      </Button>
      {estado === "enviado" && (
        <span className="text-sm text-muted-foreground">Listo, mail reenviado.</span>
      )}
      {estado === "error" && (
        <span className="text-sm text-destructive">No se pudo reenviar.</span>
      )}
    </div>
  );
}
