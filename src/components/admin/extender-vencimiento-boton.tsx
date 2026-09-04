"use client";

import { useState, useTransition } from "react";
import { extenderVencimiento } from "@/app/admin/(protegido)/eventos/[id]/upload-actions";
import { Button } from "@/components/ui/button";

export function ExtenderVencimientoBoton({ eventoId }: { eventoId: string }) {
  const [estado, setEstado] = useState<"idle" | "hecho" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const extender = () => {
    startTransition(async () => {
      const resultado = await extenderVencimiento(eventoId, 7);
      setEstado(resultado?.error ? "error" : "hecho");
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={extender} disabled={isPending}>
        {isPending ? "Extendiendo..." : "+7 días"}
      </Button>
      {estado === "hecho" && (
        <span className="text-sm text-muted-foreground">Listo, código extendido.</span>
      )}
      {estado === "error" && (
        <span className="text-sm text-destructive">No se pudo extender.</span>
      )}
    </div>
  );
}
