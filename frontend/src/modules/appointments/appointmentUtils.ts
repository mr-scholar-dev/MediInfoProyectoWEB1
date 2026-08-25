export type ServiceOption = { id: number; name: string; price: number; duration: number }
export type AdditionalOption = { id: number; name: string; price: number }
// Suma minutos a una hora HH:mm.
export function addMinutes(time: string, minutes: number) { const [h, m] = time.split(':').map(Number); const total = h * 60 + m + minutes; return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }
export function calculateAppointment(service: ServiceOption | undefined, extraIds: number[], extras: AdditionalOption[], start: string) { const extraCost = extras.filter(x => extraIds.includes(x.id)).reduce((sum, x) => sum + x.price, 0); const duration = service?.duration || 0; return { duration, extraCost, total: (service?.price || 0) + extraCost, endTime: start ? addMinutes(start, duration) : '--:--' } }
