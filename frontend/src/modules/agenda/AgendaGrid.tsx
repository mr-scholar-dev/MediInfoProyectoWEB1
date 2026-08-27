// AgendaGrid dibuja la cuadrícula de horas, empleados, citas y restricciones.
import { CalendarClock } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { overlaps } from '../appointments/availability'

export type AgendaEmployee = { id: number; name: string }
export type AgendaItem = { id: number; employeeId: number; start: string; end: string; client: string; service: string; status: string }
export type AgendaRestriction = { employeeId?: number | null; start?: string | null; end?: string | null; reason: string }
type Props = { employees: AgendaEmployee[]; items: AgendaItem[]; restrictions: AgendaRestriction[]; hours: string[] }

// Recorta "HH:MM:SS" a "HH:MM" para mostrar y comparar.
const shortTime = (time: string) => time.slice(0, 5)
const nextHour = (hour: string) => `${String(Number(hour.slice(0, 2)) + 1).padStart(2, '0')}:00`

export function AgendaGrid({ employees, items, restrictions, hours }: Props) {
  return <div className="agenda-panel" style={{ '--agenda-columns': employees.length } as CSSProperties}><div className="agenda-head"><div className="agenda-time-head">Hora</div>{employees.map(employee => <div key={employee.id} className="agenda-employee-head"><div className="agenda-avatar">{employee.name[0]}</div><strong>{employee.name}</strong></div>)}</div>{hours.map(hour => <div className="agenda-row" key={hour}><div className="agenda-time">{hour}</div>{employees.map(employee => { const slotEnd = nextHour(hour); const appointment = items.find(item => item.employeeId === employee.id && overlaps(hour, slotEnd, item.start, item.end)); const restriction = restrictions.find(item => (!item.employeeId || item.employeeId === employee.id) && (!item.start || !item.end || overlaps(hour, slotEnd, item.start, item.end))); if (appointment) return <Link key={employee.id} className="agenda-cell agenda-busy agenda-link" to={`/citas/${appointment.id}`} aria-label={`Ver detalle de la cita de ${appointment.client}`}><strong>{appointment.service}</strong><span>{appointment.client}</span><small className="agenda-hours">{shortTime(appointment.start)} - {shortTime(appointment.end)}</small><small>{appointment.status}</small></Link>; if (restriction) return <div key={employee.id} className="agenda-cell agenda-restricted"><CalendarClock size={15} /><span>{restriction.reason}</span>{restriction.start && restriction.end ? <small className="agenda-hours">{shortTime(restriction.start)} - {shortTime(restriction.end)}</small> : <small>Todo el día</small>}</div>; return <div key={employee.id} className="agenda-cell agenda-free"><span>Disponible</span></div> })}</div>)}</div>
}
