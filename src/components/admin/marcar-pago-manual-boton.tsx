"use client";

import { useState, useTransition } from "react";
import { marcarPagoManual } from "@/app/admin/(protegido)/eventos/actions";
import { Button } from "@/components/ui/button";

export function MarcarPagoManualBoton({ eventoId }: { eventoId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const marcar = () => {
    const confirmado = window.confirm(
      "¿Confirmás que este pago se cobró por fuera de Mercado Pago? Esto va a habilitar la descarga de las fotos originales y mandar el mail de pago confirmado."
    );
    if (!confirmado) return;

    setError(null);
    startTransition(async () => {
      const resultado = await marcarPagoManual(eventoId);
      if (resultado?.error) setError(resultado.error);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={marcar} disabled={isPending}>
        {isPending ? "Marcando..." : "Marcar como pagado a mano"}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
