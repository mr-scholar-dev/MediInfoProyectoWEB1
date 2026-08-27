// StatusBadge traduce estados del API a etiquetas con colores consistentes.
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Etiqueta de estado reutilizable sobre el Badge de shadcn.
 * Traduce el estado del API a color (enunciado: Pendiente amarillo,
 * Confirmada azul, Finalizada verde, Cancelada rojo).
 */
const TONE: Record<string, string> = {
  Confirmada: "bg-info-bg text-info",
  Finalizada: "bg-ok-bg text-ok",
  Cancelada: "bg-danger-bg text-danger",
  "En proceso": "bg-surface-3 text-text-dim",
  Pendiente: "bg-warn-bg text-warn",
  Activo: "bg-ok-bg text-ok",
  Inactivo: "bg-surface-3 text-text-dim",
  Disponible: "bg-ok-bg text-ok",
  "Cita asignada": "bg-info-bg text-info",
  Restricción: "bg-danger-bg text-danger",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-md border-0 font-semibold shadow-[inset_0_0_0_1px_#ffffff0a]", TONE[status] ?? "bg-surface-3 text-text-dim", className)}
    >
      {status}
    </Badge>
  )
}
