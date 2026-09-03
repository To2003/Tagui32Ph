"use client";

import { useEffect, useCallback } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DialogPortal, DialogOverlay } from "@/components/ui/dialog";

type FotoLightbox = { src: string; ancho: number | null; alto: number | null };

export function Lightbox({
  fotos,
  indice,
  onCerrar,
  onCambiarIndice,
}: {
  fotos: FotoLightbox[];
  indice: number | null;
  onCerrar: () => void;
  onCambiarIndice: (indice: number) => void;
}) {
  const abierto = indice !== null;

  const anterior = useCallback(() => {
    if (indice === null) return;
    onCambiarIndice((indice - 1 + fotos.length) % fotos.length);
  }, [indice, fotos.length, onCambiarIndice]);

  const siguiente = useCallback(() => {
    if (indice === null) return;
    onCambiarIndice((indice + 1) % fotos.length);
  }, [indice, fotos.length, onCambiarIndice]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") siguiente();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, anterior, siguiente]);

  if (indice === null) return null;
  const foto = fotos[indice];

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Foto {indice + 1} de {fotos.length}
          </DialogPrimitive.Title>

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
            >
              <X className="size-6" />
            </button>
          </DialogPrimitive.Close>

          {fotos.length > 1 && (
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={anterior}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60 sm:left-4"
            >
              <ChevronLeft className="size-7" />
            </button>
          )}

          <img
            src={foto.src}
            alt={`Foto ${indice + 1}`}
            draggable={false}
            className="pointer-events-none max-h-[85vh] max-w-full select-none object-contain"
          />

          {fotos.length > 1 && (
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={siguiente}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60 sm:right-4"
            >
              <ChevronRight className="size-7" />
            </button>
          )}

          <p className="text-sm text-white/70">
            {indice + 1} / {fotos.length}
          </p>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
