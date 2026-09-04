"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  solicitudSchema,
  deportes,
  type SolicitudInput,
  type SolicitudOutput,
} from "@/lib/validaciones/agendar";
import { crearSolicitud } from "@/app/(sitio)/agendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function Campo({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function AgendarForm() {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudInput, unknown, SolicitudOutput>({
    resolver: zodResolver(solicitudSchema),
  });

  const deporteSeleccionado = watch("deporte");

  const onSubmit = async (datos: SolicitudOutput) => {
    setErrorGeneral(null);
    const resultado = await crearSolicitud(datos);
    if (resultado?.error) {
      setErrorGeneral(resultado.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Campo label="Deporte" error={errors.deporte?.message}>
        <Select
          value={deporteSeleccionado}
          onValueChange={(v) => setValue("deporte", v, { shouldValidate: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí un deporte" />
          </SelectTrigger>
          <SelectContent>
            {deportes.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo label="Nombre del equipo" error={errors.equipo?.message}>
        <Input placeholder="Los Pibes FC" {...register("equipo")} />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Fecha del partido" error={errors.fecha?.message}>
          <Input type="date" {...register("fecha")} />
        </Campo>
        <Campo label="Horario" error={errors.hora?.message}>
          <Input type="time" {...register("hora")} />
        </Campo>
      </div>

      <Campo label="Lugar" error={errors.lugar?.message}>
        <Input placeholder="Cancha, club, dirección" {...register("lugar")} />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Duración estimada (hs)" error={errors.duracionHoras?.message}>
          <Input type="number" step="0.5" min="0.5" placeholder="1.5" {...register("duracionHoras")} />
        </Campo>
        <Campo label="Cantidad de jugadores" error={errors.cantidadJugadores?.message}>
          <Input type="number" min="1" placeholder="14" {...register("cantidadJugadores")} />
        </Campo>
      </div>

      <Campo label="Notas (opcional)" error={errors.notas?.message}>
        <Textarea
          placeholder="Algo que tengamos que saber sobre el partido"
          {...register("notas")}
        />
      </Campo>

      <div className="mt-2 border-t border-border/60 pt-6">
        <p className="mb-4 text-sm uppercase tracking-wider text-muted-foreground">
          Datos de contacto
        </p>
        <div className="flex flex-col gap-6">
          <Campo label="Tu nombre" error={errors.contactoNombre?.message}>
            <Input placeholder="Nombre y apellido" {...register("contactoNombre")} />
          </Campo>
          <Campo label="Email" error={errors.contactoEmail?.message}>
            <Input type="email" placeholder="vos@email.com" {...register("contactoEmail")} />
          </Campo>
          <Campo label="WhatsApp" error={errors.contactoWhatsapp?.message}>
            <Input placeholder="+54 9 11 1234-5678" {...register("contactoWhatsapp")} />
          </Campo>
        </div>
      </div>

      {errorGeneral && (
        <p className="text-sm text-destructive">{errorGeneral}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className={cn("text-base", isSubmitting && "opacity-70")}
      >
        {isSubmitting ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}
