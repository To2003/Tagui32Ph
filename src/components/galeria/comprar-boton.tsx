"use client";

import { useState } from "react";
import { formatearPrecio } from "@/lib/fecha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ComprarBoton({
  codigo,
  precioCentavos,
}: {
  codigo: string;
  precioCentavos: number;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarCupon, setMostrarCupon] = useState(false);
  const [cupon, setCupon] = useState("");
  const [validando, setValidando] = useState(false);
  const [resultadoCupon, setResultadoCupon] = useState<{
    valido: boolean;
    porcentaje?: number;
  } | null>(null);

  const validarCupon = async () => {
    if (!cupon.trim()) return;
    setValidando(true);
    setResultadoCupon(null);
    try {
      const res = await fetch("/api/cupon/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cupon }),
      });
      const data = await res.json();
      setResultadoCupon(data);
    } catch {
      setResultadoCupon({ valido: false });
    } finally {
      setValidando(false);
    }
  };

  const precioFinal =
    resultadoCupon?.valido && resultadoCupon.porcentaje
      ? Math.round(precioCentavos * (1 - resultadoCupon.porcentaje / 100))
      : precioCentavos;

  const comprar = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, cupon: resultadoCupon?.valido ? cupon : "" }),
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
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-2">
            <Input
              value={cupon}
              onChange={(e) => {
                setCupon(e.target.value);
                setResultadoCupon(null);
              }}
              onBlur={validarCupon}
              placeholder="Código de descuento"
              className="w-40 text-right uppercase"
              disabled={cargando}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={validarCupon}
              disabled={cargando || validando || !cupon.trim()}
            >
              {validando ? "..." : "Aplicar"}
            </Button>
          </div>
          {resultadoCupon?.valido && (
            <p className="text-sm text-emerald-400">
              Cupón válido: {resultadoCupon.porcentaje}% off
            </p>
          )}
          {resultadoCupon && !resultadoCupon.valido && (
            <p className="text-sm text-destructive">Ese cupón no existe.</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarCupon(true)}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ¿Tenés un cupón?
        </button>
      )}

      {resultadoCupon?.valido && precioFinal !== precioCentavos && (
        <p className="text-sm text-muted-foreground">
          Total a pagar: <span className="text-foreground">{formatearPrecio(precioFinal)}</span>
        </p>
      )}

      <Button size="lg" onClick={comprar} disabled={cargando}>
        {cargando ? "Redirigiendo..." : "Comprar pack"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
