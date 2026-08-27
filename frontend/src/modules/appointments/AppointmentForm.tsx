// Formulario reutilizable para crear y editar citas.
// Consulta datos del API, calcula costo/duración y valida disponibilidad.
import { CalendarDays, Check, Clock3, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { api } from '../../services/api'
import { calculateAppointment, type AdditionalOption, type ServiceOption } from './appointmentUtils'
import { buildDaySegments, scheduleRangesForDate, validateAppointment, type ApiSchedule, type EmployeeAppointment, type EmployeeRestriction, type ScheduleRange } from './availability'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus } from 'lucide-react'
import './appointment-form.css'

type Service = { id: number; nombre: string; precioBase: number; duracionMinutos: number }
type Additional = { id: number; nombre: string; precio: number }
type Employee = { id: number; usuario?: { nombre?: string; primerApellido?: string }; servicios?: { id: number }[]; servicioIds?: number[] }
type Client = { id: number; nombre: string; primerApellido?: string; correo?: string }
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

// ============================================================================
// Proceso principal del sistema: crear/editar una cita.
// Integra todos los módulos: cliente, servicio y adicionales (costo/duración
// automáticos), empleado (filtrado por servicio asignado), fecha/hora, agenda
// del empleado (horario + citas + restricciones) y validación de disponibilidad
// local + consulta al API antes de permitir guardar. Reutilizado por
// NewAppointmentPage y EditAppointmentPage (prop `appointment`).
// ============================================================================
export function AppointmentForm({ appointment }: { appointment?: ExistingAppointment }) {
  const { user } = useAuth(); const navigate = useNavigate()
  const editing = Boolean(appointment)
  const [services, setServices] = useState<ServiceOption[]>([]); const [extras, setExtras] = useState<AdditionalOption[]>([]); const [employees, setEmployees] = useState<Employee[]>([]); const [clients, setClients] = useState<Client[]>([])
  const [serviceId, setServiceId] = useState<number | undefined>(appointment?.servicioId); const [employeeId, setEmployeeId] = useState<number | undefined>(appointment?.empleadoId); const [clientId, setClientId] = useState<number | undefined>(appointment?.clienteId)
  const [extraIds, setExtraIds] = useState<number[]>(() => Array.from(new Set(appointment?.adicionalIds || []))); const [date, setDate] = useState(appointment?.fecha || ''); const [start, setStart] = useState(appointment?.horaInicio || '09:00'); const [notes, setNotes] = useState(appointment?.observaciones || '')
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [availability, setAvailability] = useState<Availability>(); const [error, setError] = useState('')
  const [ranges, setRanges] = useState<ScheduleRange[]>([]); const [agendaCitas, setAgendaCitas] = useState<EmployeeAppointment[]>([]); const [restrictions, setRestrictions] = useState<EmployeeRestriction[]>([]); const [agendaLoading, setAgendaLoading] = useState(false); const [agendaError, setAgendaError] = useState('')
  // Alta rápida de cliente sin salir del formulario de cita (usa el registro público del API).
  const [newClientOpen, setNewClientOpen] = useState(false); const [newClient, setNewClient] = useState({ nombre: '', primerApellido: '', correo: '', telefono: '', password: '' }); const [savingClient, setSavingClient] = useState(false); const [clientError, setClientError] = useState(''); const [pendingClientId, setPendingClientId] = useState<number>()
  const today = new Date().toISOString().slice(0, 10)

  // Cuando el cliente recién creado ya aparece en la lista, se selecciona.
  useEffect(() => { if (pendingClientId && clients.some(item => item.id === pendingClientId)) { setClientId(pendingClientId); setPendingClientId(undefined) } }, [clients, pendingClientId])

  const updateNewClient = (key: keyof typeof newClient, value: string) => setNewClient(current => ({ ...current, [key]: value }))
  // Crea un cliente con el endpoint público (/usuarios/registro), recarga la
  // lista y lo deja seleccionado en la cita. No crea endpoints nuevos.
  async function createClient() {
    const c = newClient
    setClientError('')
    if (!c.nombre.trim() || !c.primerApellido.trim() || !c.correo.trim() || !c.password) return setClientError('Completá nombre, apellido, correo y contraseña.')
    if (c.password.length < 8 || !/[A-Z]/.test(c.password) || !/[a-z]/.test(c.password) || !/[0-9]/.test(c.password)) return setClientError('La contraseña debe tener 8 caracteres, con mayúscula, minúscula y número.')
    setSavingClient(true)
    try {
      // El registro suele devolver el usuario creado; usamos su id (respaldo por correo).
      const createdResponse = await api.create<Client | { data?: Client }>('/usuarios/registro', { nombre: c.nombre.trim(), primerApellido: c.primerApellido.trim(), correo: c.correo.trim(), telefono: c.telefono || null, password: c.password })
      const createdId = unwrap(createdResponse)?.id
      const refreshed = unwrap(await api.list<Client[] | { data: Client[] }>('/usuarios?rol=Cliente')) || []
      setClients(refreshed)
      const targetId = createdId ?? refreshed.find(item => item.correo === c.correo.trim())?.id
      // Se difiere la selección a un efecto: garantiza que el nuevo cliente ya
      // esté en la lista del <Select> antes de marcarlo como elegido.
      if (targetId) setPendingClientId(targetId)
      setNewClientOpen(false)
      setNewClient({ nombre: '', primerApellido: '', correo: '', telefono: '', password: '' })
    } catch (cause) { setClientError(messageFrom(cause)) } finally { setSavingClient(false) }
  }

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
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Cliente</Label>
          <button type="button" onClick={() => { setClientError(''); setNewClientOpen(true) }} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-brand-bright">
            <UserPlus size={14} /> Nuevo cliente
          </button>
        </div>
        <Select value={clientId ? String(clientId) : ''} onValueChange={value => setClientId(Number(value))}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Seleccioná un cliente" /></SelectTrigger>
          <SelectContent>{clients.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.nombre} {item.primerApellido || ''}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Empleado</Label>
        <Select value={employeeId ? String(employeeId) : ''} onValueChange={value => setEmployeeId(Number(value))} disabled={filteredEmployees.length === 0}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Seleccioná un empleado" /></SelectTrigger>
          <SelectContent>{filteredEmployees.map(item => <SelectItem key={item.id} value={String(item.id)}>{employeeName(item)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {filteredEmployees.length === 0 && <div className="form-error">Ningún empleado activo tiene asignado el servicio seleccionado.</div>}
      <div className="form-grid">
        <div className="grid gap-2">
          <Label htmlFor="cita-fecha">Fecha</Label>
          <div className="relative">
            <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="cita-fecha" required min={today} type="date" value={date} onChange={event => setDate(event.target.value)} className="pl-9 font-mono" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cita-hora">Hora</Label>
          <div className="relative">
            <Clock3 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="cita-hora" required type="time" value={start} onChange={event => setStart(event.target.value)} className="pl-9 font-mono" />
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cita-obs">Observaciones</Label>
        <Textarea id="cita-obs" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Notas opcionales para la cita" />
      </div>
      {date && <div className={`availability-message ${localError ? 'unavailable' : availability?.disponible ? 'available' : availability ? 'unavailable' : ''}`}>{localError || availability?.motivo || 'Validando disponibilidad...'}</div>}
    </div>
    {employeeId && date && <div className="form-section"><p className="eyebrow">Agenda del día</p><h2>Disponibilidad del empleado</h2>
      {agendaLoading && <div className="agenda-loading"><LoaderCircle className="spin" size={16} /> Cargando agenda...</div>}
      {agendaError && <div className="form-error">{agendaError}</div>}
      {!agendaLoading && !agendaError && segments.length === 0 && <div className="agenda-empty">El establecimiento no atiende ese día.</div>}
      {!agendaLoading && !agendaError && segments.length > 0 && <div className="table-panel agenda-table"><table><thead><tr><th>Inicio</th><th>Fin</th><th>Estado</th></tr></thead><tbody>{segments.map((segment, index) => <tr key={`${segment.start}-${index}`}><td>{segment.start}</td><td>{segment.end}</td><td><StatusBadge status={segment.status} />{segment.detail && <small className="segment-detail">{segment.detail}</small>}</td></tr>)}</tbody></table></div>}
    </div>}
    <div className="form-section"><p className="eyebrow">Servicio principal</p><h2>Elegí un servicio</h2><div className="option-list">{services.map(item => <button type="button" className={`option-card ${serviceId === item.id ? 'selected' : ''}`} onClick={() => setServiceId(item.id)} key={item.id}><span><strong>{item.name}</strong><small>{item.duration} minutos</small></span><b>₡{item.price.toLocaleString('es-CR')}</b>{serviceId === item.id && <Check size={16} />}</button>)}</div></div>
    <div className="form-section"><p className="eyebrow">Opcional</p><h2>Servicios adicionales</h2><div className="option-list">{extras.map(item => <button type="button" className={`option-card ${extraIds.includes(item.id) ? 'selected' : ''}`} onClick={() => toggle(item.id)} key={item.id}><span><strong>{item.name}</strong><small>No modifica la duración</small></span><b>+ ₡{item.price.toLocaleString('es-CR')}</b>{extraIds.includes(item.id) && <Check size={16} />}</button>)}</div></div>
    {(error || localError) && <div className="form-error">{error || localError}</div>}
    <Button type="submit" disabled={!canSubmit} className="justify-self-start">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar cita'}</Button>
  </form>
  <aside className="appointment-summary"><p className="eyebrow">Resumen</p><h2>Detalle de la cita</h2><div className="summary-line"><span>Cliente</span><strong>{clients.find(item => item.id === clientId)?.nombre || 'Sin seleccionar'}</strong></div><div className="summary-line"><span>Servicio</span><strong>{service?.name || 'Sin seleccionar'}</strong></div><div className="summary-line"><span>Horario</span><strong>{start} - {summary.endTime}</strong></div><div className="summary-line"><span>Duración</span><strong>{summary.duration} minutos</strong></div><div className="summary-line"><span>Adicionales</span><strong>₡{summary.extraCost.toLocaleString('es-CR')}</strong></div><div className="summary-total"><span>Total estimado</span><strong>₡{summary.total.toLocaleString('es-CR')}</strong></div></aside>

  <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogDescription>Se registra como cliente y queda seleccionado en la cita.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="nc-nombre">Nombre *</Label><Input id="nc-nombre" value={newClient.nombre} onChange={e => updateNewClient('nombre', e.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="nc-apellido">Primer apellido *</Label><Input id="nc-apellido" value={newClient.primerApellido} onChange={e => updateNewClient('primerApellido', e.target.value)} /></div>
        </div>
        <div className="grid gap-2"><Label htmlFor="nc-correo">Correo electrónico *</Label><Input id="nc-correo" type="email" value={newClient.correo} onChange={e => updateNewClient('correo', e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="nc-tel">Teléfono</Label><Input id="nc-tel" value={newClient.telefono} onChange={e => updateNewClient('telefono', e.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="nc-pass">Contraseña *</Label><Input id="nc-pass" type="password" value={newClient.password} onChange={e => updateNewClient('password', e.target.value)} /></div>
        </div>
        {clientError && <div className="form-error">{clientError}</div>}
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={() => setNewClientOpen(false)} disabled={savingClient}>Cancelar</Button>
        <Button type="button" onClick={createClient} disabled={savingClient}>{savingClient ? 'Creando...' : 'Crear y seleccionar'}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  </div>
}
