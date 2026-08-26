import { CalendarDays, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AgendaGrid, type AgendaEmployee, type AgendaItem, type AgendaRestriction } from '../modules/agenda/AgendaGrid'
import { api } from '../services/api'
import '../modules/agenda/agenda.css'

type ApiAppointment = { id: number; empleadoId?: number; horaInicio: string; horaFin: string; cliente?: { nombre: string; primerApellido?: string }; servicio?: { nombre: string }; estadoCita?: { nombre: string } }
type ApiRestriction = { empleadoId?: number | null; horaInicio?: string | null; horaFin?: string | null; motivo?: string; todoElDia?: boolean }
type ApiAgendaEmployee = { id: number; usuario?: { nombre: string; primerApellido?: string }; citas: ApiAppointment[]; restricciones?: ApiRestriction[] }
type DailyAgenda = { empleados: ApiAgendaEmployee[]; restriccionesGenerales?: ApiRestriction[] }
type EmployeeAgenda = { empleado: ApiAgendaEmployee; citas: ApiAppointment[]; restricciones?: ApiRestriction[] }
type Schedule = { id: number; diaSemana?: { id?: number; nombre?: string }; horaInicio: string; horaFin: string; activo?: boolean }

function employeeName(employee: ApiAgendaEmployee) { return `${employee.usuario?.nombre || 'Empleado'} ${employee.usuario?.primerApellido || ''}`.trim() }
const toMinutes = (time: string) => { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
// Nombres normalizados (sin acentos) de los días, alineados con Date.getDay().
const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
// Busca el horario de atención activo que corresponde a la fecha seleccionada.
function findDaySchedule(schedules: Schedule[], date: string) {
  const weekday = new Date(`${date}T00:00:00`).getDay()
  return schedules.find(schedule => {
    if (schedule.activo === false) return false
    if (schedule.diaSemana?.nombre) return normalize(schedule.diaSemana.nombre) === dayNames[weekday]
    // Sin nombre, asumimos ids 1=Lunes ... 7=Domingo.
    if (typeof schedule.diaSemana?.id === 'number') return schedule.diaSemana.id % 7 === weekday % 7 || schedule.diaSemana.id === (weekday === 0 ? 7 : weekday)
    return false
  })
}
// Genera los bloques de una hora entre horaInicio y horaFin del establecimiento.
function buildHours(schedule: Schedule) {
  const start = Math.floor(toMinutes(schedule.horaInicio) / 60)
  const end = toMinutes(schedule.horaFin)
  const slots: string[] = []
  for (let hour = start; hour * 60 < end; hour += 1) slots.push(`${String(hour).padStart(2, '0')}:00`)
  return slots
}
function mapData(employees: ApiAgendaEmployee[], globalRestrictions: ApiRestriction[]) {
  const mappedEmployees: AgendaEmployee[] = employees.map(employee => ({ id: employee.id, name: employeeName(employee) }))
  // Ordena las citas cronológicamente para que cada columna se lea en orden.
  const items: AgendaItem[] = employees.flatMap(employee => employee.citas.map(item => ({ id: item.id, employeeId: item.empleadoId || employee.id, start: item.horaInicio, end: item.horaFin, client: item.cliente ? `${item.cliente.nombre} ${item.cliente.primerApellido || ''}`.trim() : 'Sin cliente', service: item.servicio?.nombre || 'Sin servicio', status: item.estadoCita?.nombre || 'Pendiente' }))).sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const restrictions: AgendaRestriction[] = [...employees.flatMap(employee => (employee.restricciones || []).map(item => ({ employeeId: employee.id, start: item.todoElDia ? null : item.horaInicio, end: item.todoElDia ? null : item.horaFin, reason: item.motivo || 'Restricción' }))), ...globalRestrictions.map(item => ({ employeeId: null, start: item.todoElDia ? null : item.horaInicio, end: item.todoElDia ? null : item.horaFin, reason: item.motivo || 'Restricción general' }))]
  return { mappedEmployees, items, restrictions }
}

export function AgendaPage() {
  const [searchParams] = useSearchParams(); const employeeFilter = Number(searchParams.get('empleado')) || undefined; const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [employees, setEmployees] = useState<AgendaEmployee[]>([]); const [items, setItems] = useState<AgendaItem[]>([]); const [restrictions, setRestrictions] = useState<AgendaRestriction[]>([]); const [schedules, setSchedules] = useState<Schedule[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => {
    // Reinicia el spinner en cada cambio de fecha o filtro.
    setLoading(true); setError('')
    const endpoint = employeeFilter ? `/empleados/${employeeFilter}/agenda?fecha=${date}` : `/citas/agenda-diaria?fecha=${date}`
    const agendaRequest = employeeFilter ? api.get<EmployeeAgenda>(endpoint).then(result => mapData([{ ...result.empleado, id: employeeFilter, citas: result.citas, restricciones: result.restricciones }], [])) : api.get<DailyAgenda>(endpoint).then(result => mapData(result.empleados || [], result.restriccionesGenerales || []))
    Promise.all([agendaRequest, api.get<Schedule[]>('/horarios-atencion')]).then(([result, scheduleList]) => { setEmployees(result.mappedEmployees); setItems(result.items); setRestrictions(result.restrictions); setSchedules(scheduleList || []) }).catch(cause => setError(cause instanceof Error ? cause.message : 'No se pudo cargar la agenda.')).finally(() => setLoading(false))
  }, [date, employeeFilter])
  const visibleEmployees = employeeFilter ? employees.filter(employee => employee.id === employeeFilter) : employees; const visibleItems = employeeFilter ? items.filter(item => item.employeeId === employeeFilter) : items; const visibleRestrictions = employeeFilter ? restrictions.filter(item => !item.employeeId || item.employeeId === employeeFilter) : restrictions
  const daySchedule = findDaySchedule(schedules, date); const hours = daySchedule ? buildHours(daySchedule) : []
  return <section className="page-shell"><div className="section-heading"><div><p className="eyebrow">Planificación</p><h1>Agenda diaria</h1><p className="lead">Visualizá la disponibilidad real {employeeFilter ? 'del empleado seleccionado' : 'por empleado'}.</p></div><label className="date-picker"><CalendarDays size={16} /><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label></div><div className="legend"><span><i className="legend-dot free" />Disponible</span><span><i className="legend-dot busy" />Cita asignada</span><span><i className="legend-dot restricted" />Restricción</span></div>{loading && <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando agenda...</p></div>}{error && <div className="empty-state"><h2>No se pudo cargar la agenda</h2><p>{error}</p></div>}{!loading && !error && !daySchedule && <div className="empty-state"><h2>Sin atención</h2><p>El establecimiento no atiende este día.</p></div>}{!loading && !error && daySchedule && visibleEmployees.length === 0 && <div className="empty-state"><h2>No hay empleados disponibles</h2><p>El API no devolvió empleados activos para esta fecha.</p></div>}{!loading && !error && daySchedule && visibleEmployees.length > 0 && <AgendaGrid employees={visibleEmployees} items={visibleItems} restrictions={visibleRestrictions} hours={hours} />}</section>
}
