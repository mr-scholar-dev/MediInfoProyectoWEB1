import { CalendarClock } from 'lucide-react'
import { overlaps } from '../appointments/availability'

export type AgendaEmployee = { id: number; name: string }
export type AgendaItem = { id: number; employeeId: number; start: string; end: string; client: string; service: string; status: string }
export type AgendaRestriction = { employeeId?: number | null; start?: string | null; end?: string | null; reason: string }
type Props = { employees: AgendaEmployee[]; items: AgendaItem[]; restrictions: AgendaRestriction[] }

const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

export function AgendaGrid({ employees, items, restrictions }: Props) {
  return <div className="agenda-panel"><div className="agenda-head"><div className="agenda-time-head">Hora</div>{employees.map(employee => <div key={employee.id} className="agenda-employee-head"><div className="agenda-avatar">{employee.name[0]}</div><strong>{employee.name}</strong></div>)}</div>{hours.map(hour => <div className="agenda-row" key={hour}><div className="agenda-time">{hour}</div>{employees.map(employee => { const appointment = items.find(item => item.employeeId === employee.id && overlaps(hour, `${String(Number(hour.slice(0, 2)) + 1).padStart(2, '0')}:00`, item.start, item.end)); const restriction = restrictions.find(item => (!item.employeeId || item.employeeId === employee.id) && (!item.start || !item.end || overlaps(hour, `${String(Number(hour.slice(0, 2)) + 1).padStart(2, '0')}:00`, item.start, item.end))); return <div className={`agenda-cell ${appointment ? 'agenda-busy' : restriction ? 'agenda-restricted' : 'agenda-free'}`} key={employee.id}>{appointment ? <><strong>{appointment.service}</strong><span>{appointment.client}</span><small>{appointment.status}</small></> : restriction ? <><CalendarClock size={15} /><span>{restriction.reason}</span></> : <span>Disponible</span>}</div>})}</div>)}</div>
}
