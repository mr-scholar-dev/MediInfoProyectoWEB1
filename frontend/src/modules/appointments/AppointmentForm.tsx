import { CalendarDays, Check, Clock3, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { api } from '../../services/api'
import { calculateAppointment, type AdditionalOption, type ServiceOption } from './appointmentUtils'
import { buildDaySegments, scheduleRangesForDate, validateAppointment, type ApiSchedule, type EmployeeAppointment, type EmployeeRestriction, type ScheduleRange } from './availability'
import './appointment-form.css'

type Service = { id: number; nombre: string; precioBase: number; duracionMinutos: number }
type Additional = { id: number; nombre: string; precio: number }
type Employee = { id: number; usuario?: { nombre?: string; primerApellido?: string }; servicios?: { id: number }[]; servicioIds?: number[] }
type Client = { id: number; nombre: string; primerApellido?: string }
type Availability = { disponible: boolean; motivo: string }
type ApiAgendaAppointment = { id: number; horaInicio: string; horaFin: string; cliente?: { nombre: string; primerApellido?: string }; servicio?: { nombre: string }; estadoCita?: { nombre: string } }
type EmployeeAgenda = { citas?: ApiAgendaAppointment[] }
type FallbackAppointment = ApiAgendaAppointment & { empleadoId?: number; fecha?: string }
type ApiRestriction = { fecha?: string; horaInicio?: string | null; horaFin?: string | null; motivo?: string; todoElDia?: boolean; empleadoId?: number | null; empleado?: { id?: number } | null }

export type ExistingAppointment = { id: number; clienteId: number; empleadoId: number; servicioId: number; adicionalIds?: number[]; fecha: string; horaInicio: string; observaciones?: string | null }

function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }
function employeeName(item: Employee) { return `${item.usuario?.nombre || 'Empleado'} ${item.usuario?.primerApellido || ''}`.trim() }
function employeeServiceIds(item: Employee) { return item.servicioIds || (item.servicios ? item.servicios.map(service => service.id) : undefined) }

export function AppointmentForm({ appointment }: { appointment?: ExistingAppointment }) {
  const { user } = useAuth(); const navigate = useNavigate()
  const editing = Boolean(appointment)
  const [services, setServices] = useState<ServiceOption[]>([]); const [extras, setExtras] = useState<AdditionalOption[]>([]); const [employees, setEmployees] = useState<Employee[]>([]); const [clients, setClients] = useState<Client[]>([])
  const [serviceId, setServiceId] = useState<number | undefined>(appointment?.servicioId); const [employeeId, setEmployeeId] = useState<number | undefined>(appointment?.empleadoId); const [clientId, setClientId] = useState<number | undefined>(appointment?.clienteId)
  const [extraIds, setExtraIds] = useState<number[]>(() => Array.from(new Set(appointment?.adicionalIds || []))); const [date, setDate] = useState(appointment?.fecha || ''); const [start, setStart] = useState(appointment?.horaInicio || '09:00'); const [notes, setNotes] = useState(appointment?.observaciones || '')
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [availability, setAvailability] = useState<Availability>(); const [error, setError] = useState('')
  const [ranges, setRanges] = useState<ScheduleRange[]>([]); const [agendaCitas, setAgendaCitas] = useState<EmployeeAppointment[]>([]); const [restrictions, setRestrictions] = useState<EmployeeRestriction[]>([]); const [agendaLoading, setAgendaLoading] = useState(false); const [agendaError, setAgendaError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    Promise.all([api.list<Service[] | { data: Service[] }>('/servicios/activos'), api.list<Additional[] | { data: Additional[] }>('/servicios-adicionales/activos'), api.list<Employee[] | { data: Employee[] }>('/empleados/activos'), api.list<Client[] | { data: Client[] }>('/usuarios?rol=Cliente')])
      .then(async ([serviceData, extraData, employeeData, clientData]) => {
        const nextServices = (unwrap(serviceData) || []).map(item => ({ id: item.id, name: item.nombre, price: Number(item.precioBase), duration: item.duracionMinutos }))
        setServices(nextServices); setServiceId(current => current ?? nextServices[0]?.id)
        setExtras((unwrap(extraData) || []).map(item => ({ id: item.id, name: item.nombre, price: Number(item.precio) })))
        let nextEmployees = unwrap(employeeData) || []
        // Si la lista no trae los servicios asignados, se consulta el detalle de cada empleado.
        if (nextEmployees.some(item => !employeeServiceIds(item))) {
          nextEmployees = await Promise.all(nextEmployees.map(async item => { try { const detail = await api.get<Employee>(`/empleados/${item.id}`); return { ...item, servicios: detail.servicios, servicioIds: detail.servicioIds } } catch { return item } }))
        }
        setEmployees(nextEmployees)
        const nextClients = unwrap(clientData) || []; setClients(nextClients); setClientId(current => current ?? nextClients[0]?.id)
      })
      .catch(cause => setError(messageFrom(cause))).finally(() => setLoading(false))
  }, [])

  // Solo se muestran los empleados que tienen asignado el servicio principal seleccionado.
  const filteredEmployees = useMemo(() => { if (!serviceId) return employees; return employees.filter(item => { const ids = employeeServiceIds(item); return !ids || ids.includes(serviceId) }) }, [employees, serviceId])
  useEffect(() => { if (loading) return; if (!employeeId || !filteredEmployees.some(item => item.id === employeeId)) setEmployeeId(filteredEmployees[0]?.id) }, [filteredEmployees, employeeId, loading])

  const service = services.find(item => item.id === serviceId)
  const summary = useMemo(() => calculateAppointment(service, extraIds, extras, start), [service, extraIds, extras, start])

  // Carga la agenda del empleado: horario del establecimiento, citas del día y restricciones.
  useEffect(() => {
    if (!employeeId || !date) { setRanges([]); setAgendaCitas([]); setRestrictions([]); setAgendaError(''); return }
    let cancelled = false
    setAgendaLoading(true); setAgendaError('')
    Promise.all([
      api.list<ApiSchedule[] | { data: ApiSchedule[] }>('/horarios-atencion'),
      api.get<EmployeeAgenda>(`/empleados/${employeeId}/agenda?fecha=${date}`).catch(async (): Promise<EmployeeAgenda> => { const all = unwrap(await api.list<FallbackAppointment[] | { data: FallbackAppointment[] }>('/citas')) || []; return { citas: all.filter(item => item.empleadoId === employeeId && item.fecha === date) } }),
      api.list<ApiRestriction[] | { data: ApiRestriction[] }>('/restricciones-horario')
    ]).then(([scheduleData, agenda, restrictionData]) => {
      if (cancelled) return
      setRanges(scheduleRangesForDate(unwrap(scheduleData) || [], date))
      setAgendaCitas((agenda.citas || []).map(item => ({ id: item.id, horaInicio: item.horaInicio, horaFin: item.horaFin, estado: item.estadoCita?.nombre || 'Pendiente', servicio: item.servicio?.nombre, cliente: item.cliente ? `${item.cliente.nombre} ${item.cliente.primerApellido || ''}`.trim() : undefined })))
      setRestrictions((unwrap(restrictionData) || []).filter(item => item.fecha === date && (!(item.empleadoId || item.empleado?.id) || item.empleadoId === employeeId || item.empleado?.id === employeeId)).map(item => ({ horaInicio: item.horaInicio, horaFin: item.horaFin, motivo: item.motivo, todoElDia: item.todoElDia, general: !(item.empleadoId || item.empleado?.id) })))
    }).catch(cause => { if (!cancelled) setAgendaError(messageFrom(cause)) }).finally(() => { if (!cancelled) setAgendaLoading(false) })
    return () => { cancelled = true }
  }, [employeeId, date])

  // Validación local antes de consultar o guardar.
  const localError = useMemo(() => validateAppointment({ fecha: date, horaInicio: start, horaFin: summary.endTime, hoy: today, ranges, citas: agendaCitas, restricciones: restrictions, citaIdExcluir: appointment?.id }), [date, start, summary.endTime, today, ranges, agendaCitas, restrictions, appointment?.id])
  const segments = useMemo(() => buildDaySegments(ranges, appointment ? agendaCitas.filter(item => item.id !== appointment.id) : agendaCitas, restrictions), [ranges, agendaCitas, restrictions, appointment])

  // Consulta disponibilidad en el API al cambiar los datos que afectan el horario.
  useEffect(() => {
    if (!date || !employeeId || !serviceId || !summary.endTime || summary.endTime === '--:--') return
    api.create<Availability>('/citas/disponibilidad', { empleadoId: employeeId, servicioId: serviceId, fecha: date, horaInicio: start, horaFin: summary.endTime, citaIdExcluir: appointment?.id ?? null })
      .then(result => setAvailability(unwrap(result))).catch(cause => setAvailability({ disponible: false, motivo: messageFrom(cause) }))
  }, [date, employeeId, serviceId, start, summary.endTime, appointment?.id])

  const toggle = (id: number) => setExtraIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const canSubmit = !saving && !localError && Boolean(availability?.disponible) && Boolean(date) && date >= today

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!serviceId || !employeeId || !clientId || !date || !service) return setError('Seleccioná cliente, empleado, servicio y fecha.')
    if (localError) return setError(localError)
    if (!availability || availability.disponible === false) return setError(availability?.motivo || 'Esperá a que se valide la disponibilidad.')
    setSaving(true); setError('')
    const body = { clienteId: clientId, empleadoId: employeeId, servicioId: serviceId, fecha: date, horaInicio: start, horaFin: summary.endTime, duracionMinutos: summary.duration, precioServicio: service.price, costoAdicionales: summary.extraCost, costoTotal: summary.total, observaciones: notes.trim() || null, adicionalIds: Array.from(new Set(extraIds)) }
    try {
      if (appointment) { await api.update(`/citas/${appointment.id}`, body); navigate(`/citas/${appointment.id}`) }
      else { await api.create('/citas', { ...body, estadoCitaId: 1, creadoPorUsuarioId: user?.id }); navigate('/citas') }
    } catch (cause) { setError(messageFrom(cause)) } finally { setSaving(false) }
  }

  if (loading) return <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando opciones del API...</p></div>
  return <div className="appointment-builder"><form className="builder-form" onSubmit={submit}>
    <div className="form-section"><p className="eyebrow">Información principal</p><h2>Datos de la cita</h2>
      <label>Cliente<select required value={clientId ?? ''} onChange={event => setClientId(Number(event.target.value))}>{clients.map(item => <option key={item.id} value={item.id}>{item.nombre} {item.primerApellido || ''}</option>)}</select></label>
      <label>Empleado<select required value={employeeId ?? ''} onChange={event => setEmployeeId(Number(event.target.value))}>{filteredEmployees.map(item => <option key={item.id} value={item.id}>{employeeName(item)}</option>)}</select></label>
      {filteredEmployees.length === 0 && <div className="form-error">Ningún empleado activo tiene asignado el servicio seleccionado.</div>}
      <div className="form-grid"><label>Fecha<div className="field-with-icon"><CalendarDays size={16} /><input required min={today} type="date" value={date} onChange={event => setDate(event.target.value)} /></div></label><label>Hora<div className="field-with-icon"><Clock3 size={16} /><input required type="time" value={start} onChange={event => setStart(event.target.value)} /></div></label></div>
      <label>Observaciones<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Notas opcionales para la cita" /></label>
      {date && <div className={`availability-message ${localError ? 'unavailable' : availability?.disponible ? 'available' : availability ? 'unavailable' : ''}`}>{localError || availability?.motivo || 'Validando disponibilidad...'}</div>}
    </div>
    {employeeId && date && <div className="form-section"><p className="eyebrow">Agenda del día</p><h2>Disponibilidad del empleado</h2>
      {agendaLoading && <div className="agenda-loading"><LoaderCircle className="spin" size={16} /> Cargando agenda...</div>}
      {agendaError && <div className="form-error">{agendaError}</div>}
      {!agendaLoading && !agendaError && segments.length === 0 && <div className="agenda-empty">El establecimiento no atiende ese día.</div>}
      {!agendaLoading && !agendaError && segments.length > 0 && <div className="table-panel agenda-table"><table><thead><tr><th>Inicio</th><th>Fin</th><th>Estado</th></tr></thead><tbody>{segments.map((segment, index) => <tr key={`${segment.start}-${index}`}><td>{segment.start}</td><td>{segment.end}</td><td><span className={`status ${segment.status === 'Disponible' ? 'status-green' : segment.status === 'Cita asignada' ? 'status-blue' : 'status-red'}`}>{segment.status}</span>{segment.detail && <small className="segment-detail">{segment.detail}</small>}</td></tr>)}</tbody></table></div>}
    </div>}
    <div className="form-section"><p className="eyebrow">Servicio principal</p><h2>Elegí un servicio</h2><div className="option-list">{services.map(item => <button type="button" className={`option-card ${serviceId === item.id ? 'selected' : ''}`} onClick={() => setServiceId(item.id)} key={item.id}><span><strong>{item.name}</strong><small>{item.duration} minutos</small></span><b>₡{item.price.toLocaleString('es-CR')}</b>{serviceId === item.id && <Check size={16} />}</button>)}</div></div>
    <div className="form-section"><p className="eyebrow">Opcional</p><h2>Servicios adicionales</h2><div className="option-list">{extras.map(item => <button type="button" className={`option-card ${extraIds.includes(item.id) ? 'selected' : ''}`} onClick={() => toggle(item.id)} key={item.id}><span><strong>{item.name}</strong><small>No modifica la duración</small></span><b>+ ₡{item.price.toLocaleString('es-CR')}</b>{extraIds.includes(item.id) && <Check size={16} />}</button>)}</div></div>
    {(error || localError) && <div className="form-error">{error || localError}</div>}
    <button className="primary-button" disabled={!canSubmit}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar cita'}</button>
  </form>
  <aside className="appointment-summary"><p className="eyebrow">Resumen</p><h2>Detalle de la cita</h2><div className="summary-line"><span>Cliente</span><strong>{clients.find(item => item.id === clientId)?.nombre || 'Sin seleccionar'}</strong></div><div className="summary-line"><span>Servicio</span><strong>{service?.name || 'Sin seleccionar'}</strong></div><div className="summary-line"><span>Horario</span><strong>{start} - {summary.endTime}</strong></div><div className="summary-line"><span>Duración</span><strong>{summary.duration} minutos</strong></div><div className="summary-line"><span>Adicionales</span><strong>₡{summary.extraCost.toLocaleString('es-CR')}</strong></div><div className="summary-total"><span>Total estimado</span><strong>₡{summary.total.toLocaleString('es-CR')}</strong></div></aside></div>
}
