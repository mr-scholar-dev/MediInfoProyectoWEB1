// Carga una cita existente y reutiliza el formulario para editarla.
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { AppointmentForm, type ExistingAppointment } from '../modules/appointments/AppointmentForm'
import './edit.css'

type Appointment = ExistingAppointment & { estadoCita?: { nombre: string } }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }

export function EditAppointmentPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Appointment>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => { if (!id) return; api.get<Appointment>(`/citas/${id}`).then(setItem).catch(cause => setError(messageFrom(cause))).finally(() => setLoading(false)) }, [id])

  if (loading) return <section className="page-shell"><div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando cita...</p></div></section>
  if (!item) return <section className="page-shell"><div className="empty-state"><h2>No se pudo cargar la cita</h2><p>{error}</p></div></section>
  const status = item.estadoCita?.nombre
  // Las citas finalizadas o canceladas no admiten edición.
  if (status === 'Finalizada' || status === 'Cancelada') return <section className="page-shell"><Link className="back-link" to={`/citas/${item.id}`}><ArrowLeft size={14} /> Volver al detalle</Link><div className="empty-state"><h2>Esta cita no se puede editar</h2><p>Las citas en estado {status} no admiten modificaciones.</p></div></section>
  return <section className="page-shell"><Link className="back-link" to={`/citas/${item.id}`}><ArrowLeft size={14} /> Volver al detalle</Link><div className="section-heading"><div><p className="eyebrow">Edición</p><h1>Editar cita</h1><p className="lead">Podés cambiar fecha, horario, servicio y adicionales. La disponibilidad se valida antes de guardar.</p></div></div><AppointmentForm appointment={item} /></section>
}
// Formulario para editar una cita existente.
