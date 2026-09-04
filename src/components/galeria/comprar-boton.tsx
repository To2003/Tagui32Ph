"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ComprarBoton({ codigo }: { codigo: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [cupon, setCupon] = useState("");

  const comprar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, cupon }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "No pudimos iniciar el pago.");
        setCargando(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("No pudimos iniciar el pago. Probá de nuevo.");
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {mostrarCupon ? (
        <Input
          value={cupon}
          onChange={(e) => setCupon(e.target.value)}
          placeholder="Código de descuento"
          className="w-44 text-right uppercase"
          disabled={cargando}
        />
      ) : (
        <button
          type="button"
          onClick={() => setMostrarCupon(true)}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ¿Tenés un cupón?
        </button>
      )}
      <Button size="lg" onClick={comprar} disabled={cargando}>
        {cargando ? "Redirigiendo..." : "Comprar pack"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
