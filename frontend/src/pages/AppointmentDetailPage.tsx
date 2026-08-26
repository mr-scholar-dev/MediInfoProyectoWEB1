import { ArrowLeft, Edit3, LoaderCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import './detail.css'

type Appointment = { id: number; fecha: string; horaInicio: string; horaFin: string; observaciones?: string | null; cliente?: { nombre: string; primerApellido?: string; correo?: string }; empleado?: { usuario?: { nombre?: string; primerApellido?: string } }; servicio?: { nombre: string; duracionMinutos: number }; estadoCita?: { id?: number; nombre: string } }
type AppointmentStatus = { id: number; nombre: string; activo?: boolean; permiteEdicion?: boolean; permiteCancelacionCliente?: boolean }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }

export function AppointmentDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth()
  const [item, setItem] = useState<Appointment>(); const [statuses, setStatuses] = useState<AppointmentStatus[]>([])
  const [loading, setLoading] = useState(true); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [changing, setChanging] = useState(false)
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

  const status = item.estadoCita?.nombre || 'Pendiente'
  const canManage = user?.rol === 'Administrador' || user?.rol === 'Empleado'
  const clientName = item.cliente ? `${item.cliente.nombre} ${item.cliente.primerApellido || ''}`.trim() : 'Sin cliente'
  const empleado = item.empleado?.usuario ? `${item.empleado.usuario.nombre || ''} ${item.empleado.usuario.primerApellido || ''}`.trim() : 'Sin empleado'
  // La acción disponible depende de la configuración del estado en el API (permiteEdicion / permiteCancelacionCliente).
  const currentFlags = statuses.find(option => option.id === item.estadoCita?.id || option.nombre === status)
  const canEdit = canManage && (currentFlags?.permiteEdicion ?? (status !== 'Finalizada' && status !== 'Cancelada'))
  const canCancel = user?.rol === 'Cliente'
    ? (currentFlags?.permiteCancelacionCliente ?? status === 'Pendiente')
    : status !== 'Cancelada' && status !== 'Finalizada'

  return (
    <section className="page-shell">
      <Link className="back-link" to="/citas"><ArrowLeft size={14} /> Volver a citas</Link>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Detalle de cita</p>
          <h1>Cita de {clientName} — {item.fecha}</h1>
          <p className="lead">{item.servicio?.nombre || 'Servicio sin definir'} · Información completa y acciones disponibles.</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="detail-grid">
        <Card className="gap-4 p-6">
          <div>
            <p className="eyebrow">Información</p>
            <h2 className="font-display text-lg font-semibold">Datos de la cita</h2>
          </div>
          <div className="detail-list">
            <div><span>Cliente</span><strong>{clientName}</strong></div>
            <div><span>Empleado</span><strong>{empleado}</strong></div>
            <div><span>Fecha y horario</span><strong>{item.fecha} · {item.horaInicio} - {item.horaFin}</strong></div>
            <div><span>Duración</span><strong>{item.servicio?.duracionMinutos || '--'} minutos</strong></div>
            <div><span>Observaciones</span><strong>{item.observaciones || 'Sin observaciones'}</strong></div>
          </div>
        </Card>
        <Card className="gap-4 p-6">
          <div>
            <p className="eyebrow">Gestión</p>
            <h2 className="font-display text-lg font-semibold">Acciones</h2>
          </div>
          <div className="grid gap-3">
            {canManage && (
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select value={item.estadoCita?.id ? String(item.estadoCita.id) : ''} onValueChange={value => changeStatus(Number(value))} disabled={changing}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccioná un estado" /></SelectTrigger>
                  <SelectContent>{statuses.map(option => <SelectItem key={option.id} value={String(option.id)}>{option.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {canEdit && <Button asChild variant="secondary" className="w-full"><Link to={`/citas/${id}/editar`}><Edit3 size={16} /> Editar información</Link></Button>}
            {canCancel && <Button variant="destructive" className="w-full" onClick={() => { setCancelReason(''); setCancelError(''); setCancelOpen(true) }}><XCircle size={17} /> Cancelar cita</Button>}
            {!canEdit && !canCancel && !canManage && <p className="lead">No hay acciones disponibles para esta cita.</p>}
          </div>
        </Card>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar esta cita</DialogTitle>
            <DialogDescription>Indicá el motivo de la cancelación (mínimo 5 caracteres). Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="cancel-motivo">Motivo de cancelación</Label>
            <Textarea id="cancel-motivo" autoFocus value={cancelReason} onChange={event => setCancelReason(event.target.value)} placeholder="Ej: el cliente no puede asistir" />
          </div>
          {cancelError && <div className="form-error">{cancelError}</div>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelling}>Volver</Button>
            <Button type="button" variant="destructive" onClick={confirmCancel} disabled={cancelling}>{cancelling ? 'Cancelando...' : 'Cancelar cita'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
