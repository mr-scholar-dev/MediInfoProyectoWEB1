import { ArrowLeft, CalendarDays, Edit3, LoaderCircle, Power } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import './detail.css'

type Restriction = { id: number; fecha?: string; horaInicio?: string; horaFin?: string; todoElDia?: boolean; motivo?: string }
type EmployeeCita = { estadoCitaId?: number }
type Employee = { id: number; codigoEmpleado: string; descripcion?: string; activo?: boolean; usuario?: { nombre?: string; primerApellido?: string; correo?: string }; especialidad?: { nombre: string }; servicios?: { id: number; nombre: string }[]; restricciones?: Restriction[]; citas?: EmployeeCita[]; _count?: { citas?: number }; cantidadCitas?: number }
type StatusRow = { id: number; bloqueaDisponibilidad?: boolean }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
// El API entrega fecha/hora de restricciones como ISO en el detalle del empleado.
function onlyDate(value?: string) { return value ? value.slice(0, 10) : '' }
function onlyTime(value?: string | null) { return value ? (value.includes('T') ? value.slice(11, 16) : value.slice(0, 5)) : '' }

export function EmployeeDetailPage() {
  const { id } = useParams()
  const [employee, setEmployee] = useState<Employee>()
  const [blockingIds, setBlockingIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [changing, setChanging] = useState(false); const [confirming, setConfirming] = useState(false)

  const load = useCallback(() => { if (!id) return; api.get<Employee>(`/empleados/${id}`).then(setEmployee).catch(cause => setError(messageFrom(cause))) }, [id])
  useEffect(() => { load() }, [load])
  useEffect(() => { api.list<StatusRow[] | { data: StatusRow[] }>('/estados-cita').then(result => { const rows = unwrap(result) || []; setBlockingIds(new Set(rows.filter(row => row.bloqueaDisponibilidad).map(row => row.id))) }).catch(() => undefined) }, [])

  // Solo bloquean la desactivación las citas en un estado que ocupa agenda (pendiente/confirmada/en proceso).
  const activeCitas = useMemo(() => employee?.citas?.filter(cita => cita.estadoCitaId != null && blockingIds.has(cita.estadoCitaId)).length ?? 0, [employee, blockingIds])

  async function toggleState() { if (!employee) return; setConfirming(false); setChanging(true); setError(''); setMessage(''); try { await api.patch(`/empleados/${employee.id}/estado`, { activo: employee.activo === false }); setMessage(employee.activo === false ? 'Empleado activado correctamente.' : 'Empleado desactivado correctamente.'); load() } catch (cause) { setError(messageFrom(cause)) } finally { setChanging(false) } }
  function requestToggle() { if (!employee) return; if (employee.activo === false) { void toggleState(); return } setConfirming(true) }

  if (!employee) return <section className="page-shell"><div className="empty-state">{error ? <p>{error}</p> : <><LoaderCircle className="spin" size={24} /><p>Cargando empleado...</p></>}</div></section>
  const fullName = `${employee.usuario?.nombre || employee.codigoEmpleado} ${employee.usuario?.primerApellido || ''}`.trim()
  const citasCount = employee._count?.citas ?? employee.cantidadCitas ?? employee.citas?.length ?? 0
  const blocked = employee.activo !== false && activeCitas > 0

  return (
    <section className="page-shell">
      <Link className="back-link" to="/empleados"><ArrowLeft size={14} /> Volver a empleados</Link>
      <div className="section-heading">
        <div><p className="eyebrow">Detalle de empleado</p><h1>{fullName}</h1><p className="lead">Información general y servicios asignados.</p></div>
        <div className="action-inline">
          <Button asChild variant="secondary"><Link to={`/empleados/${id}/editar`}><Edit3 size={16} /> Editar</Link></Button>
          <Button asChild><Link to={`/agenda?empleado=${id}`}><CalendarDays size={16} /> Ver agenda</Link></Button>
        </div>
      </div>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="detail-grid">
        <Card className="gap-4 p-6">
          <div><p className="eyebrow">Información</p><h2 className="font-display text-lg font-semibold">Datos generales</h2></div>
          <div className="detail-list">
            <div><span>Código</span><strong>{employee.codigoEmpleado}</strong></div>
            <div><span>Correo</span><strong>{employee.usuario?.correo || 'Sin correo'}</strong></div>
            <div><span>Especialidad</span><strong>{employee.especialidad?.nombre || 'Sin especialidad'}</strong></div>
            <div><span>Citas asignadas</span><strong>{citasCount}{activeCitas > 0 ? ` (${activeCitas} activas)` : ''}</strong></div>
            <div><span>Estado</span><StatusBadge status={employee.activo === false ? 'Inactivo' : 'Activo'} /></div>
          </div>
          <Button variant="secondary" onClick={requestToggle} disabled={changing} className="justify-self-start">
            <Power size={16} /> {changing ? 'Actualizando...' : employee.activo === false ? 'Activar empleado' : 'Desactivar empleado'}
          </Button>
        </Card>
        <Card className="gap-4 p-6">
          <div><p className="eyebrow">Capacidades</p><h2 className="font-display text-lg font-semibold">Servicios asignados</h2></div>
          <div className="flex flex-wrap gap-2">
            {employee.servicios?.map(service => <Badge key={service.id} variant="secondary" className="bg-info-bg text-info border-0">{service.nombre}</Badge>)}
            {!employee.servicios?.length && <p className="text-sm text-muted-foreground">Sin servicios asignados.</p>}
          </div>
        </Card>
        <Card className="gap-4 p-6">
          <div><p className="eyebrow">Disponibilidad</p><h2 className="font-display text-lg font-semibold">Restricciones de horario</h2></div>
          <div className="detail-list">
            {employee.restricciones?.map(restriction => (
              <div key={restriction.id}>
                <span>{restriction.motivo || 'Restricción'}</span>
                <strong>{onlyDate(restriction.fecha)}{restriction.fecha ? ' · ' : ''}{restriction.todoElDia || !restriction.horaInicio ? 'Todo el día' : `${onlyTime(restriction.horaInicio)} - ${onlyTime(restriction.horaFin)}`}</strong>
              </div>
            ))}
            {!employee.restricciones?.length && <p className="text-sm text-muted-foreground">Sin restricciones registradas.</p>}
          </div>
        </Card>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blocked ? 'No se puede desactivar' : '¿Desactivar empleado?'}</DialogTitle>
            <DialogDescription>
              {blocked
                ? `Este empleado tiene ${activeCitas} cita${activeCitas === 1 ? '' : 's'} pendiente${activeCitas === 1 ? '' : 's'} o confirmada${activeCitas === 1 ? '' : 's'}. No puede desactivarse hasta que esas citas se finalicen o cancelen.`
                : 'Un empleado inactivo no podrá recibir nuevas citas. ¿Querés continuar?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Volver</Button>
            {!blocked && <Button onClick={toggleState} disabled={changing}>Desactivar empleado</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
