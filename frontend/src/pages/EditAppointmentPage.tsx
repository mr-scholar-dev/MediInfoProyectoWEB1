import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { addMinutes } from '../modules/appointments/appointmentUtils'
import './edit.css'

type Appointment = { id: number; fecha: string; horaInicio: string; horaFin: string; observaciones?: string | null; duracionMinutos: number; precioServicio: number; costoAdicionales: number; costoTotal: number; clienteId: number; empleadoId: number; servicioId: number; adicionalIds?: number[]; estadoCita?: { nombre: string } }
type Availability = { disponible: boolean; motivo: string }

function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }

export function EditAppointmentPage() {
  const { id } = useParams(); const navigate = useNavigate()
  const [item, setItem] = useState<Appointment>(); const [form, setForm] = useState({ fecha: '', horaInicio: '', observaciones: '' }); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  useEffect(() => { if (!id) return; api.get<Appointment>(`/citas/${id}`).then(value => { setItem(value); setForm({ fecha: value.fecha, horaInicio: value.horaInicio, observaciones: value.observaciones || '' }) }).catch(cause => setError(messageFrom(cause))).finally(() => setLoading(false)) }, [id])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!item || !form.fecha || !form.horaInicio) return setError('La fecha y la hora de inicio son obligatorias.')
    setSaving(true); setError('')
    try {
      const endTime = addMinutes(form.horaInicio, Number(item.duracionMinutos))
      const availability = unwrap(await api.create<Availability>('/citas/disponibilidad', { empleadoId: item.empleadoId, servicioId: item.servicioId, fecha: form.fecha, horaInicio: form.horaInicio, horaFin: endTime, citaIdExcluir: item.id }))
      if (!availability.disponible) { setError(availability.motivo); return }
      await api.update(`/citas/${item.id}`, { clienteId: item.clienteId, empleadoId: item.empleadoId, servicioId: item.servicioId, fecha: form.fecha, horaInicio: form.horaInicio, horaFin: endTime, duracionMinutos: Number(item.duracionMinutos), precioServicio: Number(item.precioServicio), costoAdicionales: Number(item.costoAdicionales), costoTotal: Number(item.costoTotal), observaciones: form.observaciones.trim() || null, adicionalIds: item.adicionalIds || [] })
      navigate(`/citas/${item.id}`)
    } catch (cause) { setError(messageFrom(cause)) } finally { setSaving(false) }
  }

  if (loading) return <section className="page-shell"><div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando cita...</p></div></section>
  if (!item) return <section className="page-shell"><div className="empty-state"><h2>No se pudo cargar la cita</h2><p>{error}</p></div></section>
  return <section className="page-shell"><Link className="back-link" to={`/citas/${item.id}`}><ArrowLeft size={14} /> Volver al detalle</Link><div className="section-heading"><div><p className="eyebrow">Edición</p><h1>Editar cita</h1><p className="lead">La disponibilidad se valida antes de guardar.</p></div></div><form className="panel edit-form" onSubmit={submit}><label>Fecha<input type="date" value={form.fecha} onChange={event => setForm({ ...form, fecha: event.target.value })} required /></label><label>Hora de inicio<input type="time" value={form.horaInicio} onChange={event => setForm({ ...form, horaInicio: event.target.value })} required /></label><label>Observaciones<textarea value={form.observaciones} onChange={event => setForm({ ...form, observaciones: event.target.value })} /></label>{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></form></section>
}
