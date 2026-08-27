import { ArrowLeft, Edit3, LoaderCircle, Power } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import './detail.css'

type ServiceCita = { estadoCitaId?: number }
type Service = { id: number; nombre: string; descripcion: string; precioBase: number; duracionMinutos: number; activo?: boolean; imagen?: string | null; especialidad?: { nombre: string }; citas?: ServiceCita[] }
type StatusRow = { id: number; bloqueaDisponibilidad?: boolean }
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function ServiceDetailPage() {
  const { id } = useParams()
  const [service, setService] = useState<Service | null>(null)
  const [blockingIds, setBlockingIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [confirming, setConfirming] = useState(false); const [changing, setChanging] = useState(false)

  useEffect(() => { api.get<Service>(`/servicios/${id}`).then(setService).catch(e => setError(e.message)) }, [id])
  useEffect(() => { api.list<StatusRow[] | { data: StatusRow[] }>('/estados-cita').then(result => { const rows = unwrap(result) || []; setBlockingIds(new Set(rows.filter(row => row.bloqueaDisponibilidad).map(row => row.id))) }).catch(() => undefined) }, [])

  const activeCitas = useMemo(() => service?.citas?.filter(cita => cita.estadoCitaId != null && blockingIds.has(cita.estadoCitaId)).length ?? 0, [service, blockingIds])

  async function toggle() { if (!service) return; setConfirming(false); setChanging(true); setError(''); setMessage(''); try { await api.patch(`/servicios/${id}/estado`, { activo: service.activo === false }); setService({ ...service, activo: service.activo === false }); setMessage('Estado actualizado correctamente.') } catch (e) { setError((e as Error).message) } finally { setChanging(false) } }
  function requestToggle() { if (!service) return; if (service.activo === false) { void toggle(); return } setConfirming(true) }

  if (!service) return <section className="page-shell"><div className="empty-state">{error ? <p>{error}</p> : <><LoaderCircle size={24} /><p>Cargando servicio...</p></>}</div></section>
  const blocked = service.activo !== false && activeCitas > 0

  return (
    <section className="page-shell">
      <Link className="back-link" to="/servicios"><ArrowLeft size={14} /> Volver a servicios</Link>
      <div className="section-heading">
        <div><p className="eyebrow">Detalle de servicio</p><h1>{service.nombre}</h1><p className="lead">{service.especialidad?.nombre || 'Servicio principal'}</p></div>
        <div className="action-inline">
          <Button asChild variant="secondary"><Link to={`/servicios/${id}/editar`}><Edit3 size={16} /> Editar</Link></Button>
          <Button onClick={requestToggle} disabled={changing}><Power size={16} /> {service.activo === false ? 'Activar' : 'Desactivar'}</Button>
        </div>
      </div>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="detail-grid">
        <Card className="gap-4 p-6">
          <p className="eyebrow">Información</p>
          {service.imagen && <img className="image-preview detail-image" src={`${apiUrl}/images/download/${service.imagen}`} alt={`Imagen de ${service.nombre}`} />}
          <h2 className="font-display text-lg font-semibold">Descripción</h2>
          <p className="text-sm text-muted-foreground">{service.descripcion}</p>
          <div className="detail-list">
            <div><span>Precio base</span><strong>₡{Number(service.precioBase).toLocaleString('es-CR')}</strong></div>
            <div><span>Duración</span><strong>{service.duracionMinutos} minutos</strong></div>
            <div><span>Citas activas</span><strong>{activeCitas}</strong></div>
            <div><span>Estado</span><StatusBadge status={service.activo === false ? 'Inactivo' : 'Activo'} /></div>
          </div>
        </Card>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blocked ? 'No se puede desactivar' : '¿Desactivar servicio?'}</DialogTitle>
            <DialogDescription>
              {blocked
                ? `Este servicio tiene ${activeCitas} cita${activeCitas === 1 ? '' : 's'} pendiente${activeCitas === 1 ? '' : 's'} o confirmada${activeCitas === 1 ? '' : 's'}. No puede desactivarse hasta que esas citas se finalicen o cancelen.`
                : 'Un servicio inactivo no podrá seleccionarse en nuevas citas. ¿Querés continuar?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Volver</Button>
            {!blocked && <Button onClick={toggle} disabled={changing}>Desactivar servicio</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
// Muestra el detalle de un servicio principal.
