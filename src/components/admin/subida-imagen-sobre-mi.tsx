"use client";

import { useState } from "react";
import { generarImagenSinMarca } from "@/lib/watermark";
import { subirArchivo } from "@/lib/subida-cliente";
import {
  crearUrlSubidaSobreMi,
  guardarImagenSobreMi,
} from "@/app/admin/(protegido)/sobre-mi/actions";
import { Input } from "@/components/ui/input";

export function SubidaImagenSobreMi({
  campo,
  label,
  urlActual,
}: {
  campo: "sobre_mi_foto_key" | "sobre_mi_camara_key";
  label: string;
  urlActual: string | null;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(urlActual);

  const subir = async (archivo: File) => {
    setCargando(true);
    setError(null);
    try {
      const { blob } = await generarImagenSinMarca(archivo);
      const { key, url } = await crearUrlSubidaSobreMi("image/jpeg");
      await subirArchivo(url, blob, "image/jpeg", () => {});
      await guardarImagenSobreMi(campo, key);
      setPreview(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Probá con otro archivo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- preview local, ya viene redimensionada
        <img src={preview} alt={label} className="h-40 w-40 rounded-lg object-cover" />
      )}
      <Input
        type="file"
        accept="image/*"
        disabled={cargando}
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) subir(archivo);
        }}
      />
      {cargando && <p className="text-sm text-muted-foreground">Subiendo...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
