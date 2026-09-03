import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EstadoEvento } from "@/lib/db/tipos";

const estilos: Record<EstadoEvento, string> = {
  pendiente: "bg-amber-500/15 text-amber-400",
  confirmado: "bg-sky-500/15 text-sky-400",
  rechazado: "bg-red-500/15 text-red-400",
  fotos_subidas: "bg-teal-500/15 text-teal-400",
  pagado: "bg-emerald-500/15 text-emerald-400",
  vencido: "bg-neutral-500/15 text-neutral-400",
};

const etiquetas: Record<EstadoEvento, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
  fotos_subidas: "Fotos subidas",
  pagado: "Pagado",
  vencido: "Vencido",
};

export function EstadoBadge({ estado }: { estado: EstadoEvento }) {
  return (
    <Badge className={cn("border-0", estilos[estado])}>
      {etiquetas[estado]}
    </Badge>
  );
}
