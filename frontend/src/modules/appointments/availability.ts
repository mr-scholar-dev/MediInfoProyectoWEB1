export type TimeRange = { start: string; end: string; status: 'Disponible' | 'Ocupada' | 'Restricción' }
export function toMinutes(time: string) { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
// Dos intervalos chocan si se cruzan en cualquier punto.
export function overlaps(start: string, end: string, otherStart: string, otherEnd: string) { return toMinutes(start) < toMinutes(otherEnd) && toMinutes(end) > toMinutes(otherStart) }
// Solo citas activas y restricciones bloquean la agenda.
export function isAvailable(start: string, end: string, ranges: TimeRange[]) { return !ranges.some(range => range.status !== 'Disponible' && overlaps(start, end, range.start, range.end)) }
export function getAvailabilityMessage(start: string, end: string, ranges: TimeRange[]) { return isAvailable(start, end, ranges) ? 'Horario disponible' : 'El horario tiene un conflicto' }

// --- Agenda del empleado y validación local de disponibilidad ---

export type ScheduleRange = { start: string; end: string }
export type EmployeeAppointment = { id: number; horaInicio: string; horaFin: string; estado: string; servicio?: string; cliente?: string }
export type EmployeeRestriction = { horaInicio?: string | null; horaFin?: string | null; motivo?: string; todoElDia?: boolean; general?: boolean }
export type DaySegment = { start: string; end: string; status: 'Disponible' | 'Cita asignada' | 'Restricción'; detail?: string }

// Las citas canceladas no bloquean la agenda.
export function blockingAppointments(citas: EmployeeAppointment[], excludeId?: number) {
  return citas.filter(cita => cita.estado !== 'Cancelada' && cita.id !== excludeId)
}

function isFullDay(restriction: EmployeeRestriction) { return Boolean(restriction.todoElDia) || (!restriction.horaInicio && !restriction.horaFin) }

// Construye los segmentos del día (Disponible / Cita asignada / Restricción) en orden cronológico.
export function buildDaySegments(ranges: ScheduleRange[], citas: EmployeeAppointment[], restricciones: EmployeeRestriction[]): DaySegment[] {
  const fullDay = restricciones.find(isFullDay)
  if (fullDay) return ranges.map(range => ({ start: range.start, end: range.end, status: 'Restricción' as const, detail: fullDay.motivo || 'Todo el día' }))
  const blockers: DaySegment[] = [
    ...blockingAppointments(citas).map(cita => ({ start: cita.horaInicio, end: cita.horaFin, status: 'Cita asignada' as const, detail: [cita.servicio, cita.cliente].filter(Boolean).join(' · ') || undefined })),
    ...restricciones.filter(item => item.horaInicio && item.horaFin).map(item => ({ start: item.horaInicio as string, end: item.horaFin as string, status: 'Restricción' as const, detail: item.motivo }))
  ]
  const segments: DaySegment[] = []
  for (const range of [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))) {
    const inRange = blockers
      .filter(blocker => overlaps(blocker.start, blocker.end, range.start, range.end))
      .map(blocker => ({ ...blocker, start: toMinutes(blocker.start) < toMinutes(range.start) ? range.start : blocker.start, end: toMinutes(blocker.end) > toMinutes(range.end) ? range.end : blocker.end }))
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    let cursor = range.start
    for (const blocker of inRange) {
      if (toMinutes(blocker.start) > toMinutes(cursor)) segments.push({ start: cursor, end: blocker.start, status: 'Disponible' })
      segments.push(blocker)
      if (toMinutes(blocker.end) > toMinutes(cursor)) cursor = blocker.end
    }
    if (toMinutes(cursor) < toMinutes(range.end)) segments.push({ start: cursor, end: range.end, status: 'Disponible' })
  }
  return segments
}

export type ValidationInput = { fecha: string; horaInicio: string; horaFin: string; hoy: string; ranges: ScheduleRange[]; citas: EmployeeAppointment[]; restricciones: EmployeeRestriction[]; citaIdExcluir?: number }

// Devuelve un mensaje de error en español o cadena vacía si el horario es válido.
export function validateAppointment(input: ValidationInput): string {
  const { fecha, horaInicio, horaFin, hoy, ranges, citas, restricciones, citaIdExcluir } = input
  if (!fecha || !horaInicio || !horaFin || horaFin === '--:--') return ''
  if (fecha < hoy) return 'No podés registrar citas en fechas pasadas.'
  if (ranges.length === 0) return 'El establecimiento no atiende ese día.'
  if (!ranges.some(range => toMinutes(horaInicio) >= toMinutes(range.start) && toMinutes(horaFin) <= toMinutes(range.end))) {
    return `El horario está fuera del horario de atención (${ranges.map(range => `${range.start}-${range.end}`).join(', ')}).`
  }
  const fullDay = restricciones.find(isFullDay)
  if (fullDay) return `Hay una restricción de todo el día${fullDay.motivo ? `: ${fullDay.motivo}` : '.'}`
  const restriction = restricciones.find(item => item.horaInicio && item.horaFin && overlaps(horaInicio, horaFin, item.horaInicio, item.horaFin))
  if (restriction) return `El horario choca con una restricción${restriction.general ? ' general' : ' del empleado'}${restriction.motivo ? `: ${restriction.motivo}` : '.'}`
  const busy = blockingAppointments(citas, citaIdExcluir).find(cita => overlaps(horaInicio, horaFin, cita.horaInicio, cita.horaFin))
  if (busy) return `El empleado ya tiene una cita de ${busy.horaInicio} a ${busy.horaFin} en ese horario.`
  return ''
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
function normalize(value: string) { return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() }

export type ApiSchedule = { id: number; horaInicio: string; horaFin: string; activo?: boolean; diaSemana?: { id?: number; nombre?: string } }

// Obtiene los rangos del horario de atención que aplican a una fecha (día inactivo => sin rangos).
export function scheduleRangesForDate(schedules: ApiSchedule[], fecha: string): ScheduleRange[] {
  if (!fecha) return []
  const jsDay = new Date(`${fecha}T00:00:00`).getDay()
  const dayName = normalize(DAY_NAMES[jsDay])
  const isoDay = jsDay === 0 ? 7 : jsDay // 1 = Lunes ... 7 = Domingo
  return schedules
    .filter(item => item.activo !== false)
    .filter(item => item.diaSemana?.nombre ? normalize(item.diaSemana.nombre) === dayName : item.diaSemana?.id === isoDay)
    .map(item => ({ start: item.horaInicio, end: item.horaFin }))
}
