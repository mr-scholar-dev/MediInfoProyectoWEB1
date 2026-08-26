import { ArrowLeft, LoaderCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import './detail.css'

type Appointment = { id: number; fecha: string; horaInicio: string; horaFin: string; observaciones?: string | null; cliente?: { nombre: string; primerApellido?: string; correo?: string }; empleado?: { nombre: string; primerApellido?: string }; servicio?: { nombre: string; duracionMinutos: number }; estadoCita?: { id?: number; nombre: string } }
type AppointmentStatus = { id: number; nombre: string; activo?: boolean; permiteEdicion?: boolean; permiteCancelacionCliente?: boolean }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }
function statusClass(status: string) { return status === 'Confirmada' ? 'status-blue' : status === 'Finalizada' ? 'status-green' : status === 'Cancelada' ? 'status-red' : 'status-amber' }

export function AppointmentDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth(); const [item, setItem] = useState<Appointment>(); const [statuses, setStatuses] = useState<AppointmentStatus[]>([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [changing, setChanging] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false); const [cancelReason, setCancelReason] = useState(''); const [cancelError, setCancelError] = useState(''); const [cancelling, setCancelling] = useState(false)
  useEffect(() => { if (!id) return; Promise.all([api.get<Appointment>(`/citas/${id}`), api.list<AppointmentStatus[] | { data: AppointmentStatus[] }>('/estados-cita')]).then(([appointment, statusResult]) => { setItem(appointment); const data = statusResult && typeof statusResult === 'object' && 'data' in statusResult ? statusResult.data : statusResult; setStatuses(data || []) }).catch(cause => setError(messageFrom(cause))).finally(() => setLoading(false)) }, [id])
  async function changeStatus(estadoCitaId: number) { setChanging(true); setError(''); try { await api.patch(`/citas/${id}/estado`, { estadoCitaId }); setMessage('Estado actualizado correctamente.'); navigate(0) } catch (cause) { setError(messageFrom(cause)) } finally { setChanging(false) } }
  async function confirmCancel() {
    const motivo = cancelReason.trim()
    if (motivo.length < 5) return setCancelError('El motivo debe contener al menos 5 caracteres.')
    setCancelling(true); setCancelError('')
    try { await api.patch(`/citas/${id}/cancelar`, { motivoCancelacion: motivo }); setCancelOpen(false); setMessage('Cita cancelada correctamente.'); navigate(0) } catch (cause) { setCancelError(messageFrom(cause)) } finally { setCancelling(false) }
  }
  if (loading) return <section className="page-shell"><div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando detalle...</p></div></section>
  if (!item) return <section className="page-shell"><div className="empty-state"><h2>No se encontró la cita</h2><p>{error}</p></div></section>
  const status = item.estadoCita?.nombre || 'Pendiente'; const canManage = user?.rol === 'Administrador' || user?.rol === 'Empleado'
  const clientName = item.cliente ? `${item.cliente.nombre} ${item.cliente.primerApellido || ''}`.trim() : 'Sin cliente'
  // Las citas finalizadas o canceladas no admiten edición; el cliente solo puede cancelar citas pendientes.
  const canEdit = canManage && status !== 'Finalizada' && status !== 'Cancelada'
  const canCancel = user?.rol === 'Cliente' ? status === 'Pendiente' : status !== 'Cancelada' && status !== 'Finalizada'
  return <section className="page-shell"><Link className="back-link" to="/citas"><ArrowLeft size={14} /> Volver a citas</Link><div className="section-heading"><div><p className="eyebrow">Detalle de cita</p><h1>Cita de {clientName} — {item.fecha}</h1><p className="lead">{item.servicio?.nombre || 'Servicio sin definir'} · Información completa y acciones disponibles.</p></div><span className={`status ${statusClass(status)}`}>{status}</span></div>{message && <div className="success-message">{message}</div>}{error && <div className="form-error">{error}</div>}<div className="detail-grid"><article className="panel"><p className="eyebrow">Información</p><h2>Datos de la cita</h2><div className="detail-list"><div><span>Cliente</span><strong>{clientName}</strong></div><div><span>Empleado</span><strong>{item.empleado ? `${item.empleado.nombre} ${item.empleado.primerApellido || ''}` : 'Sin empleado'}</strong></div><div><span>Fecha y horario</span><strong>{item.fecha} · {item.horaInicio} - {item.horaFin}</strong></div><div><span>Duración</span><strong>{item.servicio?.duracionMinutos || '--'} minutos</strong></div><div><span>Observaciones</span><strong>{item.observaciones || 'Sin observaciones'}</strong></div></div></article><article className="panel"><p className="eyebrow">Gestión</p><h2>Acciones</h2>{canManage && <label>Estado<select value={item.estadoCita?.id || ''} onChange={event => changeStatus(Number(event.target.value))} disabled={changing}><option value="">Seleccioná un estado</option>{statuses.map(option => <option key={option.id} value={option.id}>{option.nombre}</option>)}</select></label>}{canEdit && <Link className="secondary-button" to={`/citas/${id}/editar`}>Editar información</Link>}{canCancel && <button className="danger-button" onClick={() => { setCancelReason(''); setCancelError(''); setCancelOpen(true) }}><XCircle size={17} /> Cancelar cita</button>}{!canEdit && !canCancel && !canManage && <p className="lead">No hay acciones disponibles para esta cita.</p>}</article></div>
    {cancelOpen && <div className="modal-overlay" onKeyDown={event => { if (event.key === 'Escape') setCancelOpen(false) }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
        <p className="eyebrow">Cancelación</p>
        <h2 id="cancel-modal-title">Cancelar esta cita</h2>
        <p className="lead">Indicá el motivo de la cancelación (mínimo 5 caracteres). Esta acción no se puede deshacer.</p>
        <label>Motivo de cancelación<textarea autoFocus value={cancelReason} onChange={event => setCancelReason(event.target.value)} placeholder="Ej: el cliente no puede asistir" /></label>
        {cancelError && <div className="form-error">{cancelError}</div>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCancelOpen(false)} disabled={cancelling}>Volver</button><button type="button" className="danger-button" onClick={confirmCancel} disabled={cancelling}>{cancelling ? 'Cancelando...' : 'Cancelar cita'}</button></div>
      </div>
    </div>}
  </section>
}
