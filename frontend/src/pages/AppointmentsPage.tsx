import { CalendarDays, LoaderCircle, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { formatShortToday } from '../lib/date'
import { api } from '../services/api'
import './detail.css'

type Appointment = { id: number; fecha: string; horaInicio: string; empleadoId?: number; cliente?: { nombre: string; primerApellido?: string }; servicio?: { nombre: string }; empleado?: { id?: number; nombre: string; primerApellido?: string }; estadoCita?: { nombre: string } }
type EmployeeRecord = { id: number; usuarioId?: number; usuario?: { id?: number; correo?: string } }
type SortOption = 'recientes' | 'antiguas' | 'estado' | 'cliente'
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
function statusClass(status: string) { return status === 'Confirmada' ? 'status-blue' : status === 'Finalizada' ? 'status-green' : status === 'Cancelada' ? 'status-red' : 'status-amber' }
function clientName(item: Appointment) { return item.cliente ? `${item.cliente.nombre} ${item.cliente.primerApellido || ''}`.trim() : '' }

export function AppointmentsPage() {
  const { user } = useAuth(); const [items, setItems] = useState<Appointment[]>([]); const [query, setQuery] = useState(''); const [sort, setSort] = useState<SortOption>('recientes'); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        if (user?.rol === 'Cliente') { setItems(unwrap(await api.list<Appointment[] | { data: Appointment[] }>(`/citas/cliente/${user.id}`)) || []); return }
        const all = unwrap(await api.list<Appointment[] | { data: Appointment[] }>('/citas')) || []
        if (user?.rol === 'Empleado') {
          // El empleado solo ve sus propias citas: se ubica su registro de empleado por usuario/correo.
          const employees = unwrap(await api.list<EmployeeRecord[] | { data: EmployeeRecord[] }>('/empleados')) || []
          const own = employees.find(record => record.usuarioId === user.id || record.usuario?.id === user.id || (record.usuario?.correo && record.usuario.correo === user.correo))
          setItems(own ? all.filter(item => item.empleadoId === own.id || item.empleado?.id === own.id) : [])
          return
        }
        setItems(all)
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las citas.') } finally { setLoading(false) }
    }
    setLoading(true); setError(''); void load()
  }, [user])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const matched = normalized ? items.filter(item => `${item.fecha} ${clientName(item)} ${item.servicio?.nombre || ''} ${item.empleado?.nombre || ''} ${item.estadoCita?.nombre || ''}`.toLowerCase().includes(normalized)) : items
    const sorted = [...matched]
    if (sort === 'recientes') sorted.sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`))
    if (sort === 'antiguas') sorted.sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
    if (sort === 'estado') sorted.sort((a, b) => (a.estadoCita?.nombre || 'Pendiente').localeCompare(b.estadoCita?.nombre || 'Pendiente', 'es'))
    if (sort === 'cliente') sorted.sort((a, b) => clientName(a).localeCompare(clientName(b), 'es'))
    return sorted
  }, [items, query, sort])
  return <section className="page-shell"><div className="section-heading"><div><p className="eyebrow">Operación diaria</p><h1>Citas</h1><p className="lead">{user?.rol === 'Empleado' ? 'Consultá las citas que tenés asignadas.' : 'Consultá y administrá las citas del establecimiento.'}</p></div>{user?.rol !== 'Cliente' && <Link className="primary-button" to="/citas/nueva"><Plus size={18} /> Nueva cita</Link>}</div><div className="toolbar"><div className="search-control"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente o servicio..." /></div><label className="sort-control">Ordenar por<select value={sort} onChange={event => setSort(event.target.value as SortOption)}><option value="recientes">Fecha (recientes primero)</option><option value="antiguas">Fecha (antiguas primero)</option><option value="estado">Estado</option><option value="cliente">Cliente</option></select></label><span className="date-button"><CalendarDays size={16} /> {formatShortToday()}</span><span className="results-count">{filtered.length} registros</span></div>{loading && <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando citas...</p></div>}{error && <div className="empty-state"><h2>No se pudieron cargar las citas</h2><p>{error}</p></div>}{!loading && !error && filtered.length === 0 && <div className="empty-state"><h2>{items.length ? 'No hay coincidencias' : 'No hay citas registradas'}</h2><p>{items.length ? 'Probá con otro término de búsqueda.' : 'Cuando se creen citas desde el sistema aparecerán aquí.'}</p></div>}{!loading && !error && filtered.length > 0 && <div className="table-panel"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Empleado</th><th>Estado</th></tr></thead><tbody>{filtered.map(item => { const status = item.estadoCita?.nombre || 'Pendiente'; return <tr key={item.id}><td><Link className="table-link" to={`/citas/${item.id}`}>{item.fecha}</Link></td><td><Link className="table-link" to={`/citas/${item.id}`}><strong>{item.horaInicio}</strong></Link></td><td>{clientName(item) || 'Sin cliente'}</td><td>{item.servicio?.nombre || 'Sin servicio'}</td><td>{item.empleado ? `${item.empleado.nombre} ${item.empleado.primerApellido || ''}` : 'Sin empleado'}</td><td><span className={`status ${statusClass(status)}`}>{status}</span></td></tr>})}</tbody></table></div>}<Link className="back-link" to="/">← Volver al resumen</Link></section>
}
