"use client";

import { useState, useTransition } from "react";
import { actualizarPrecio } from "@/app/admin/(protegido)/eventos/actions";
import { formatearPrecio } from "@/lib/fecha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EditarPrecio({
  eventoId,
  precioCentavos,
}: {
  eventoId: string;
  precioCentavos: number;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(precioCentavos / 100));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!editando) {
    return (
      <div className="flex items-center gap-3">
        <span>{formatearPrecio(precioCentavos)}</span>
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Editar
        </button>
      </div>
    );
  }

  const guardar = () => {
    setError(null);
    const centavos = Math.round(parseFloat(valor) * 100);
    startTransition(async () => {
      const resultado = await actualizarPrecio(eventoId, centavos);
      if (resultado?.error) {
        setError(resultado.error);
      } else {
        setEditando(false);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="1"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-32"
        />
        <Button type="button" size="sm" onClick={guardar} disabled={isPending}>
          Guardar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditando(false)}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
