export type TimeRange = { start: string; end: string; status: 'Disponible' | 'Ocupada' | 'Restricción' }
function toMinutes(time: string) { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
// Dos intervalos chocan si se cruzan en cualquier punto.
export function overlaps(start: string, end: string, otherStart: string, otherEnd: string) { return toMinutes(start) < toMinutes(otherEnd) && toMinutes(end) > toMinutes(otherStart) }
// Solo citas activas y restricciones bloquean la agenda.
export function isAvailable(start: string, end: string, ranges: TimeRange[]) { return !ranges.some(range => range.status !== 'Disponible' && overlaps(start, end, range.start, range.end)) }
export function getAvailabilityMessage(start: string, end: string, ranges: TimeRange[]) { return isAvailable(start, end, ranges) ? 'Horario disponible' : 'El horario tiene un conflicto' }
