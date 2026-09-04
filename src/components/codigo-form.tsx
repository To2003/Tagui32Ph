"use client";

import { useState, useTransition } from "react";
import { ingresarCodigo } from "@/app/(sitio)/galeria/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CodigoForm() {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const resultado = await ingresarCodigo(codigo);
      if (resultado?.error) {
        setError(resultado.error);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="codigo">Código de acceso</Label>
        <Input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="K7RM4XPQ"
          autoComplete="off"
          autoCapitalize="characters"
          className="text-center font-heading text-2xl tracking-[0.3em] uppercase"
          maxLength={8}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Entrando..." : "Ver mis fotos"}
      </Button>
    </form>
  );
}
