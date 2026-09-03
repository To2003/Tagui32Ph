"use client";

import { useState } from "react";
import { Lightbox } from "@/components/galeria/lightbox";

type Foto = { src: string; ancho: number | null; alto: number | null };

export function GaleriaGrid({ fotos }: { fotos: Foto[] }) {
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 md:gap-4">
        {fotos.map((foto, i) => (
          <button
            key={foto.src}
            type="button"
            onClick={() => setIndiceActivo(i)}
            onContextMenu={(e) => e.preventDefault()}
            className="group relative mb-3 block w-full overflow-hidden break-inside-avoid md:mb-4"
          >
            <img
              src={foto.src}
              alt={`Foto ${i + 1}`}
              draggable={false}
              className="pointer-events-none h-auto w-full select-none object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Lightbox
        fotos={fotos}
        indice={indiceActivo}
        onCerrar={() => setIndiceActivo(null)}
        onCambiarIndice={setIndiceActivo}
      />
    </>
  );
}
