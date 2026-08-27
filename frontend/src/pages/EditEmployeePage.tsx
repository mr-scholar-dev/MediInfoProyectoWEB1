import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import './service-form.css'

type Option = { id: number; nombre: string }
type Employee = { id: number; usuarioId: number; especialidadId: number; codigoEmpleado: string; descripcion?: string; servicios?: Option[]; servicioIds?: number[] }
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }

export function EditEmployeePage() {
  const { id } = useParams(); const navigate = useNavigate(); const [employee, setEmployee] = useState<Employee | null>(null); const [services, setServices] = useState<Option[]>([]); const [selected, setSelected] = useState<number[]>([]); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => { Promise.all([api.get<Employee>(`/empleados/${id}`), api.list<Option[] | { data: Option[] }>('/servicios/activos')]).then(([current, serviceData]) => { setEmployee(current); setServices(unwrap(serviceData) || []); setSelected(current.servicioIds || current.servicios?.map(item => item.id) || []) }).catch(e => setError(e.message)) }, [id])
  const toggle = (serviceId: number) => setSelected(current => current.includes(serviceId) ? current.filter(item => item !== serviceId) : [...current, serviceId])
  async function submit(event: FormEvent) { event.preventDefault(); if (!employee || selected.length === 0) return setError('El empleado debe tener al menos un servicio.'); if (!employee.codigoEmpleado.trim()) return setError('El código del empleado es obligatorio.'); if (!/^[A-Za-z0-9_-]+$/.test(employee.codigoEmpleado)) return setError('El código solo puede contener letras, números, guiones y guion bajo.'); setSaving(true); setError(''); try { await api.update(`/empleados/${id}`, { usuarioId: employee.usuarioId, especialidadId: employee.especialidadId, codigoEmpleado: employee.codigoEmpleado, descripcion: employee.descripcion || null, servicioIds: selected }); navigate('/empleados') } catch (e) { setError((e as Error).message) } finally { setSaving(false) } }
  if (!employee) return <section className="page-shell"><div className="empty-state">{error ? <p>{error}</p> : <><LoaderCircle size={24} /><p>Cargando empleado...</p></>}</div></section>

  return (
    <section className="page-shell">
      <Link className="back-link" to="/empleados"><ArrowLeft size={14} /> Volver a empleados</Link>
      <div className="section-heading"><div><p className="eyebrow">Equipo</p><h1>Editar empleado</h1><p className="lead">Actualizá los servicios que puede atender.</p></div></div>
      <form className="grid max-w-[720px] gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]" onSubmit={submit}>
        <div className="grid gap-2"><Label htmlFor="codigo">Código del empleado *</Label><Input id="codigo" required value={employee.codigoEmpleado} onChange={e => setEmployee({ ...employee, codigoEmpleado: e.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor="descripcion">Descripción</Label><Textarea id="descripcion" value={employee.descripcion || ''} onChange={e => setEmployee({ ...employee, descripcion: e.target.value })} /></div>
        <fieldset>
          <legend>Servicios asignados *</legend>
          {services.map(item => (
            <label className="check-option" key={item.id}>
              <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggle(item.id)} />
              {item.nombre}
            </label>
          ))}
        </fieldset>
        {error && <div className="form-error">{error}</div>}
        <Button type="submit" disabled={saving} className="justify-self-start">{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
      </form>
    </section>
  )
}
// Formulario para editar los datos y servicios de un empleado.
