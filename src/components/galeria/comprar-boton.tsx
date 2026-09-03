"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ComprarBoton({ codigo }: { codigo: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comprar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
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
      <Button size="lg" onClick={comprar} disabled={cargando}>
        {cargando ? "Redirigiendo..." : "Comprar pack"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
