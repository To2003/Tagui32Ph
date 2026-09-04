"use client";

import { useState } from "react";
import { generarImagenSinMarca } from "@/lib/watermark";
import { subirArchivo } from "@/lib/subida-cliente";
import {
  crearUrlSubidaPortfolio,
  guardarFotoPortfolio,
} from "@/app/admin/(protegido)/portfolio/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SubidaPortfolio() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [deporte, setDeporte] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subir = async () => {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    try {
      const { blob, ancho, alto } = await generarImagenSinMarca(archivo);
      const { key, url } = await crearUrlSubidaPortfolio("image/jpeg");
      await subirArchivo(url, blob, "image/jpeg", () => {});
      const res = await guardarFotoPortfolio({ key, titulo, deporte, ancho, alto });
      if (res?.error) {
        setError(res.error);
      } else {
        setArchivo(null);
        setTitulo("");
        setDeporte("");
        const input = document.getElementById("archivo-portfolio") as HTMLInputElement | null;
        if (input) input.value = "";
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la foto. Probá con otro archivo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/60 p-6">
      <p className="text-sm uppercase tracking-wider text-muted-foreground">Agregar foto</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="archivo-portfolio">Imagen</Label>
          <Input
            id="archivo-portfolio"
            type="file"
            accept="image/*"
            disabled={cargando}
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Título (opcional)</Label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={cargando}
            placeholder="Semifinal — Fútbol 5"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Deporte (opcional)</Label>
          <Input
            value={deporte}
            onChange={(e) => setDeporte(e.target.value)}
            disabled={cargando}
            placeholder="Fútbol"
          />
        </div>
        <Button type="button" onClick={subir} disabled={!archivo || cargando}>
          {cargando ? "Subiendo..." : "Subir"}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
