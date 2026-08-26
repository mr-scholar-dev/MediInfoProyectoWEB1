import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import './service-form.css'

type Option = { id: number; nombre: string; primerApellido?: string }
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }

export function NewEmployeePage() {
  const navigate = useNavigate(); const [users, setUsers] = useState<Option[]>([]); const [specialties, setSpecialties] = useState<Option[]>([]); const [services, setServices] = useState<Option[]>([]); const [selected, setSelected] = useState<number[]>([]); const [form, setForm] = useState({ usuarioId: '', especialidadId: '', codigoEmpleado: '', descripcion: '' }); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  useEffect(() => { Promise.all([api.list<Option[] | { data: Option[] }>('/usuarios?rol=Empleado'), api.list<Option[] | { data: Option[] }>('/especialidades'), api.list<Option[] | { data: Option[] }>('/servicios/activos')]).then(([u, s, v]) => { const nextUsers = unwrap(u) || []; const nextSpecialties = unwrap(s) || []; setUsers(nextUsers); setSpecialties(nextSpecialties); setServices(unwrap(v) || []); setForm(current => ({ ...current, usuarioId: String(nextUsers[0]?.id || ''), especialidadId: String(nextSpecialties[0]?.id || '') })) }).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  const toggle = (id: number) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  async function submit(event: FormEvent) { event.preventDefault(); if (!form.codigoEmpleado || !form.usuarioId || !form.especialidadId || selected.length === 0) return setError('Completá los campos y asigná al menos un servicio.'); if (!/^[A-Za-z0-9_-]+$/.test(form.codigoEmpleado)) return setError('El código solo puede contener letras, números, guiones y guion bajo.'); setSaving(true); setError(''); try { await api.create('/empleados', { usuarioId: Number(form.usuarioId), especialidadId: Number(form.especialidadId), codigoEmpleado: form.codigoEmpleado, descripcion: form.descripcion || null, servicioIds: selected }); navigate('/empleados') } catch (e) { setError((e as Error).message) } finally { setSaving(false) } }
  if (loading) return <section className="page-shell"><div className="empty-state"><LoaderCircle size={24} /><p>Cargando opciones...</p></div></section>

  return (
    <section className="page-shell">
      <Link className="back-link" to="/empleados"><ArrowLeft size={14} /> Volver a empleados</Link>
      <div className="section-heading"><div><p className="eyebrow">Equipo</p><h1>Nuevo empleado</h1><p className="lead">Asigná los servicios que puede atender.</p></div></div>
      <form className="grid max-w-[720px] gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]" onSubmit={submit}>
        <div className="grid gap-2">
          <Label>Usuario *</Label>
          <Select value={form.usuarioId} onValueChange={value => setForm({ ...form, usuarioId: value })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Seleccioná un usuario" /></SelectTrigger>
            <SelectContent>{users.map(x => <SelectItem key={x.id} value={String(x.id)}>{`${x.nombre} ${x.primerApellido || ''}`.trim()}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Especialidad *</Label>
          <Select value={form.especialidadId} onValueChange={value => setForm({ ...form, especialidadId: value })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Seleccioná una especialidad" /></SelectTrigger>
            <SelectContent>{specialties.map(x => <SelectItem key={x.id} value={String(x.id)}>{x.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-2"><Label htmlFor="codigo">Código del empleado *</Label><Input id="codigo" required value={form.codigoEmpleado} onChange={e => setForm({ ...form, codigoEmpleado: e.target.value })} placeholder="MED-001" /></div>
        <div className="grid gap-2"><Label htmlFor="descripcion">Descripción</Label><Textarea id="descripcion" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
        <fieldset>
          <legend>Servicios asignados *</legend>
          {services.map(x => (
            <label className="check-option" key={x.id}>
              <Checkbox checked={selected.includes(x.id)} onCheckedChange={() => toggle(x.id)} />
              {x.nombre}
            </label>
          ))}
        </fieldset>
        {error && <div className="form-error">{error}</div>}
        <Button type="submit" disabled={saving} className="justify-self-start">{saving ? 'Guardando...' : 'Crear empleado'}</Button>
      </form>
    </section>
  )
}
