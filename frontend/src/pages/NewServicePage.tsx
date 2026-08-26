import { ArrowLeft, ImagePlus, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import './service-form.css'

type Specialty = { id: number; nombre: string }
type UploadResponse = { fileName: string }

function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }

export function NewServicePage() {
  const navigate = useNavigate(); const [specialties, setSpecialties] = useState<Specialty[]>([]); const [form, setForm] = useState({ nombre: '', descripcion: '', precioBase: '', duracionMinutos: '', especialidadId: '' }); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => { api.list<Specialty[] | { data: Specialty[] }>('/especialidades').then(result => { const data = unwrap(result) || []; setSpecialties(data); setForm(current => ({ ...current, especialidadId: current.especialidadId || String(data[0]?.id || '') })) }).catch(cause => setError(messageFrom(cause))) }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))
  function selectFile(next: File | null) { if (preview) URL.revokeObjectURL(preview); setFile(next); setPreview(next ? URL.createObjectURL(next) : '') }
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); if (form.nombre.trim().length < 3 || form.descripcion.trim().length < 10) return setError('Completá un nombre y descripción válidos.'); if (Number(form.precioBase) <= 0 || Number(form.duracionMinutos) < 15 || !form.especialidadId) return setError('Verificá precio, duración y especialidad.'); setSaving(true); try { let imagen: string | null = null; if (file) { const data = new FormData(); data.append('image', file); const upload = unwrap(await api.create<UploadResponse>('/images/upload', data)); imagen = upload.fileName } await api.create('/servicios', { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precioBase: Number(form.precioBase), duracionMinutos: Number(form.duracionMinutos), especialidadId: Number(form.especialidadId), imagen }); navigate('/servicios') } catch (cause) { setError(messageFrom(cause)) } finally { setSaving(false) } }

  return (
    <section className="page-shell">
      <Link className="back-link" to="/servicios"><ArrowLeft size={14} /> Volver a servicios</Link>
      <div className="section-heading"><div><p className="eyebrow">Catálogo</p><h1>Nuevo servicio</h1><p className="lead">Registrá un servicio principal con su precio, duración e imagen.</p></div></div>
      <form className="grid max-w-[720px] gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]" onSubmit={submit}>
        <div className="grid gap-2"><Label htmlFor="nombre">Nombre *</Label><Input id="nombre" value={form.nombre} onChange={event => update('nombre', event.target.value)} placeholder="Ej. Consulta general" required /></div>
        <div className="grid gap-2"><Label htmlFor="descripcion">Descripción *</Label><Textarea id="descripcion" value={form.descripcion} onChange={event => update('descripcion', event.target.value)} placeholder="Describí el servicio..." required /></div>
        <div className="form-grid">
          <div className="grid gap-2"><Label htmlFor="precio">Precio base *</Label><Input id="precio" type="number" min="0.01" value={form.precioBase} onChange={event => update('precioBase', event.target.value)} required /></div>
          <div className="grid gap-2"><Label htmlFor="duracion">Duración en minutos *</Label><Input id="duracion" type="number" min="15" value={form.duracionMinutos} onChange={event => update('duracionMinutos', event.target.value)} required /></div>
        </div>
        <div className="grid gap-2">
          <Label>Especialidad *</Label>
          <Select value={form.especialidadId} onValueChange={value => update('especialidadId', value)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Seleccioná una especialidad" /></SelectTrigger>
            <SelectContent>{specialties.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="upload-box"><ImagePlus size={22} /><span>{file ? file.name : 'Seleccionar imagen representativa'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => selectFile(event.target.files?.[0] || null)} /></label>
        {preview && <img className="image-preview" src={preview} alt="Previsualización del servicio" />}
        {!specialties.length && <div className="form-error"><LoaderCircle size={14} /> No hay especialidades disponibles.</div>}
        {error && <div className="form-error">{error}</div>}
        <Button type="submit" disabled={saving || !specialties.length} className="justify-self-start">{saving ? 'Guardando...' : 'Crear servicio'}</Button>
      </form>
    </section>
  )
}
