import { CalendarDays, LoaderCircle, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { formatShortToday } from '../lib/date'
import { api } from '../services/api'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import './detail.css'

type Appointment = { id: number; fecha: string; horaInicio: string; empleadoId?: number; cliente?: { nombre: string; primerApellido?: string }; servicio?: { nombre: string }; empleado?: { id?: number; usuario?: { nombre?: string; primerApellido?: string } }; estadoCita?: { nombre: string } }
type EmployeeRecord = { id: number; usuarioId?: number; usuario?: { id?: number; correo?: string } }
type SortOption = 'recientes' | 'antiguas' | 'estado' | 'cliente'
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
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
    const matched = normalized ? items.filter(item => `${item.fecha} ${clientName(item)} ${item.servicio?.nombre || ''} ${item.empleado?.usuario?.nombre || ''} ${item.empleado?.usuario?.primerApellido || ''} ${item.estadoCita?.nombre || ''}`.toLowerCase().includes(normalized)) : items
    const sorted = [...matched]
    if (sort === 'recientes') sorted.sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`))
    if (sort === 'antiguas') sorted.sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
    if (sort === 'estado') sorted.sort((a, b) => (a.estadoCita?.nombre || 'Pendiente').localeCompare(b.estadoCita?.nombre || 'Pendiente', 'es'))
    if (sort === 'cliente') sorted.sort((a, b) => clientName(a).localeCompare(clientName(b), 'es'))
    return sorted
  }, [items, query, sort])
  return (
    <section className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operación diaria</p>
          <h1>Citas</h1>
          <p className="lead">{user?.rol === 'Empleado' ? 'Consultá las citas que tenés asignadas.' : 'Consultá y administrá las citas del establecimiento.'}</p>
        </div>
        {user?.rol !== 'Cliente' && (
          <Button asChild>
            <Link to="/citas/nueva"><Plus size={18} /> Nueva cita</Link>
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-[18px]">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente o servicio..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Ordenar por</span>
          <Select value={sort} onValueChange={value => setSort(value as SortOption)}>
            <SelectTrigger className="w-[210px]" size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Fecha (recientes primero)</SelectItem>
              <SelectItem value="antiguas">Fecha (antiguas primero)</SelectItem>
              <SelectItem value="estado">Estado</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-muted-foreground">
          <CalendarDays size={16} /> {formatShortToday()}
        </span>
        <span className="ml-auto font-mono text-xs text-text-faint">{filtered.length} registros</span>
      </div>
      {loading && <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando citas...</p></div>}
      {error && <div className="empty-state"><h2>No se pudieron cargar las citas</h2><p>{error}</p></div>}
      {!loading && !error && filtered.length === 0 && <div className="empty-state"><h2>{items.length ? 'No hay coincidencias' : 'No hay citas registradas'}</h2><p>{items.length ? 'Probá con otro término de búsqueda.' : 'Cuando se creen citas desde el sistema aparecerán aquí.'}</p></div>}
      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-panel)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => {
                const status = item.estadoCita?.nombre || 'Pendiente'
                const empleado = item.empleado?.usuario ? `${item.empleado.usuario.nombre || ''} ${item.empleado.usuario.primerApellido || ''}`.trim() : 'Sin empleado'
                return (
                  <TableRow key={item.id}>
                    <TableCell><Link className="table-link" to={`/citas/${item.id}`}>{item.fecha}</Link></TableCell>
                    <TableCell><Link className="table-link" to={`/citas/${item.id}`}><strong>{item.horaInicio}</strong></Link></TableCell>
                    <TableCell className="text-foreground">{clientName(item) || 'Sin cliente'}</TableCell>
                    <TableCell>{item.servicio?.nombre || 'Sin servicio'}</TableCell>
                    <TableCell>{empleado}</TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Link className="back-link" to="/">← Volver al resumen</Link>
    </section>
  )
}
