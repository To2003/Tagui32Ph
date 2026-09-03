"use client";

import { useState } from "react";
import { generarPreview } from "@/lib/watermark";
import { subirArchivo } from "@/lib/subida-cliente";
import { crearUrlsDeSubida, finalizarCargaFotos } from "@/app/admin/(protegido)/eventos/[id]/upload-actions";
import { formatearFecha } from "@/lib/fecha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONCURRENCIA_SUBIDA = 4;

async function conConcurrenciaLimitada<T>(
  items: T[],
  limite: number,
  trabajo: (item: T, indice: number) => Promise<void>
) {
  let cursor = 0;
  async function siguiente(): Promise<void> {
    const indice = cursor++;
    if (indice >= items.length) return;
    await trabajo(items[indice], indice);
    return siguiente();
  }
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, siguiente));
}

type Fase = "idle" | "generando" | "subiendo" | "listo";

export function SubidaFotos({ eventoId }: { eventoId: string }) {
  const [fotos, setFotos] = useState<File[]>([]);
  const [zip, setZip] = useState<File | null>(null);
  const [fase, setFase] = useState<Fase>("idle");
  const [mensaje, setMensaje] = useState("");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ codigo: string; expiraEn: string } | null>(null);

  const puedeSubir = fotos.length > 0 && zip !== null && fase === "idle";

  const subirPack = async () => {
    if (!zip) return;
    setError(null);

    try {
      // 1. Generar previews con marca de agua (secuencial, para no explotar memoria con muchas fotos a la vez).
      setFase("generando");
      const previews: { blob: Blob; ancho: number; alto: number }[] = [];
      for (let i = 0; i < fotos.length; i++) {
        setMensaje(`Generando previews... ${i + 1}/${fotos.length}`);
        previews.push(await generarPreview(fotos[i]));
      }

      // 2. Pedir URLs firmadas para el ZIP y cada preview.
      setFase("subiendo");
      setMensaje("Subiendo a R2...");
      const urls = await crearUrlsDeSubida(eventoId, previews.length, zip.type);

      // 3. Subir todo directo a R2, con progreso agregado por bytes.
      const totalBytes = zip.size + previews.reduce((acc, p) => acc + p.blob.size, 0);
      const subidoPorArchivo = new Map<string, number>();
      const actualizarProgreso = (id: string, bytes: number) => {
        subidoPorArchivo.set(id, bytes);
        const total = Array.from(subidoPorArchivo.values()).reduce((a, b) => a + b, 0);
        setProgreso(Math.min(100, Math.round((total / totalBytes) * 100)));
      };

      await Promise.all([
        subirArchivo(urls.zip.url, zip, zip.type || "application/zip", (b) =>
          actualizarProgreso("zip", b)
        ),
        conConcurrenciaLimitada(previews, CONCURRENCIA_SUBIDA, async (preview, i) => {
          await subirArchivo(urls.previews[i].url, preview.blob, "image/jpeg", (b) =>
            actualizarProgreso(`preview-${i}`, b)
          );
        }),
      ]);

      // 4. Registrar todo en la base, generar código y mandar el mail.
      setMensaje("Guardando...");
      const res = await finalizarCargaFotos(
        eventoId,
        zip.size,
        previews.map((p, i) => ({
          key: urls.previews[i].key,
          ancho: p.ancho,
          alto: p.alto,
          orden: i,
        }))
      );

      if (res?.error) {
        setError(res.error);
        setFase("idle");
        return;
      }

      setResultado(res as { codigo: string; expiraEn: string });
      setFase("listo");
    } catch (err) {
      console.error(err);
      setError("Algo falló durante la subida. Podés reintentar.");
      setFase("idle");
    }
  };

  if (fase === "listo" && resultado) {
    return (
      <div className="rounded-lg border border-border/60 p-6">
        <p className="text-sm uppercase tracking-wider text-primary">Fotos subidas</p>
        <p className="mt-2">
          Código de acceso:{" "}
          <span className="font-heading text-2xl tracking-widest text-foreground">
            {resultado.codigo}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vence el {formatearFecha(resultado.expiraEn)}. Ya le mandamos el mail al contacto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 p-6">
      <p className="text-sm uppercase tracking-wider text-muted-foreground">
        Subir pack de fotos
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Fotos editadas (todas las sueltas)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            disabled={fase !== "idle"}
            onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
          />
          {fotos.length > 0 && (
            <p className="text-sm text-muted-foreground">{fotos.length} fotos seleccionadas</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>ZIP con los originales</Label>
          <Input
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            disabled={fase !== "idle"}
            onChange={(e) => setZip(e.target.files?.[0] ?? null)}
          />
          {zip && (
            <p className="text-sm text-muted-foreground">
              {zip.name} — {(zip.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>

        {fase !== "idle" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{mensaje}</p>
            {fase === "subiendo" && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="button"
          onClick={subirPack}
          disabled={!puedeSubir}
          className="self-start"
        >
          {fase === "idle" ? "Subir pack" : "Subiendo..."}
        </Button>
      </div>
    </div>
  );
}
