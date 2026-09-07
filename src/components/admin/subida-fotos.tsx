"use client";

import { useRef, useState } from "react";
import { generarPreview } from "@/lib/watermark";
import { subirArchivo, conConcurrenciaLimitada } from "@/lib/subida-cliente";
import { subirZip } from "@/lib/subida-multipart";
import {
  crearUrlsDePreviews,
  finalizarCargaFotos,
} from "@/app/admin/(protegido)/eventos/[id]/upload-actions";
import { formatearFecha } from "@/lib/fecha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONCURRENCIA_SUBIDA = 4;

function aMB(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

type Fase = "idle" | "generando" | "subiendo" | "listo";

export function SubidaFotos({ eventoId }: { eventoId: string }) {
  const [fotos, setFotos] = useState<File[]>([]);
  const [zip, setZip] = useState<File | null>(null);
  const [fase, setFase] = useState<Fase>("idle");
  const [mensaje, setMensaje] = useState("");
  const [progresoBytes, setProgresoBytes] = useState({ subido: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ codigo: string; expiraEn: string } | null>(null);
  const controladorRef = useRef<AbortController | null>(null);

  const puedeSubir = fotos.length > 0 && zip !== null && fase === "idle";

  const cancelar = () => {
    controladorRef.current?.abort();
  };

  const subirPack = async () => {
    if (!zip) return;
    setError(null);
    setAviso(null);
    const controlador = new AbortController();
    controladorRef.current = controlador;

    try {
      // 1. Generar previews con marca de agua (secuencial, para no explotar memoria con muchas fotos a la vez).
      //    Si una foto puntual no se puede decodificar (típico: .heic de iPhone, que
      //    Chrome no sabe leer), la salteamos en vez de abortar todo el lote.
      setFase("generando");
      const previews: { blob: Blob; ancho: number; alto: number }[] = [];
      const fallidas: string[] = [];
      for (let i = 0; i < fotos.length; i++) {
        setMensaje(`Generando previews... ${i + 1}/${fotos.length}`);
        try {
          previews.push(await generarPreview(fotos[i]));
        } catch (err) {
          console.error(`No se pudo procesar ${fotos[i].name}:`, err);
          fallidas.push(fotos[i].name);
        }
      }

      if (fallidas.length > 0) {
        setAviso(
          `No pudimos procesar ${fallidas.length} foto(s): ${fallidas.join(", ")}. ` +
            `Si son .heic de iPhone, exportalas como .jpg y subilas de nuevo aparte.`
        );
      }

      if (previews.length === 0) {
        setError("Ninguna foto se pudo procesar. Revisá el formato de los archivos.");
        setFase("idle");
        return;
      }

      // 2. Pedir URLs firmadas para las previews (el ZIP arma las suyas
      //    adentro de subirZip, según si hace falta multipart o no).
      setFase("subiendo");
      setMensaje("Subiendo a R2...");
      const urlsPreviews = await crearUrlsDePreviews(eventoId, previews.length);

      // 3. Subir todo directo a R2, con progreso agregado por bytes.
      const totalBytesPreviews = previews.reduce((acc, p) => acc + p.blob.size, 0);
      const totalBytes = zip.size + totalBytesPreviews;

      let subidoZip = 0;
      const subidoPorPreview = new Map<number, number>();
      const actualizarProgreso = () => {
        const subidoPreviews = Array.from(subidoPorPreview.values()).reduce((a, b) => a + b, 0);
        setProgresoBytes({ subido: subidoZip + subidoPreviews, total: totalBytes });
      };

      // Si una de las dos falla, cancelamos la otra — si no, la que sigue
      // bien termina subiendo archivos que van a quedar huérfanos (sin
      // registro en la base) porque igual vamos a mostrar el error.
      const subidaZip = subirZip(
        zip,
        eventoId,
        (subido) => {
          subidoZip = subido;
          actualizarProgreso();
        },
        controlador.signal
      ).catch((err) => {
        controlador.abort();
        throw err;
      });

      const subidaPreviews = conConcurrenciaLimitada(previews, CONCURRENCIA_SUBIDA, async (preview, i) => {
        await subirArchivo(
          urlsPreviews[i].url,
          preview.blob,
          "image/jpeg",
          (b) => {
            subidoPorPreview.set(i, b);
            actualizarProgreso();
          },
          controlador.signal
        );
      }).catch((err) => {
        controlador.abort();
        throw err;
      });

      await Promise.all([subidaZip, subidaPreviews]);

      // 4. Registrar todo en la base, generar código y mandar el mail.
      setMensaje("Guardando...");
      const res = await finalizarCargaFotos(
        eventoId,
        zip.size,
        previews.map((p, i) => ({
          key: urlsPreviews[i].key,
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
      setError(err instanceof Error ? err.message : "Algo falló durante la subida. Podés reintentar.");
      setFase("idle");
    } finally {
      controladorRef.current = null;
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
        {aviso && <p className="mt-3 text-sm text-amber-500">{aviso}</p>}
      </div>
    );
  }

  const porcentaje =
    progresoBytes.total > 0 ? Math.round((progresoBytes.subido / progresoBytes.total) * 100) : 0;

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
              {zip.name} — {aMB(zip.size)} MB
            </p>
          )}
        </div>

        {fase !== "idle" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{mensaje}</p>
            {fase === "subiendo" && (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {porcentaje}% — {aMB(progresoBytes.subido)} MB / {aMB(progresoBytes.total)} MB
                  </p>
                  <button
                    type="button"
                    onClick={cancelar}
                    className="text-sm text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {aviso && <p className="text-sm text-amber-500">{aviso}</p>}
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
