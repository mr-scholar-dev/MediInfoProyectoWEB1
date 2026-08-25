import { ArrowLeft, ImagePlus, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import './service-form.css'

type Service = { id: number; nombre: string; descripcion: string; precioBase: number; duracionMinutos: number; especialidadId: number; imagen: string | null }
type UploadResponse = { fileName: string }
function messageFrom(cause: unknown) { return cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.' }
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'

export function EditServicePage() {
  const { id } = useParams(); const navigate = useNavigate(); const [form, setForm] = useState<Service>(); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => { if (!id) return; api.get<Service>(`/servicios/${id}`).then(setForm).catch(cause => setError(messageFrom(cause))) }, [id])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const update = (key: keyof Service, value: string | number | null) => setForm(current => current ? { ...current, [key]: value } : current)
  function selectFile(next: File | null) { if (preview) URL.revokeObjectURL(preview); setFile(next); setPreview(next ? URL.createObjectURL(next) : '') }
  async function submit(event: FormEvent) { event.preventDefault(); if (!form || form.nombre.trim().length < 3 || form.descripcion.trim().length < 10 || form.precioBase <= 0 || form.duracionMinutos < 15) return setError('Revisá los campos obligatorios y sus valores.'); setSaving(true); setError(''); try { let imagen = form.imagen; if (file) { const data = new FormData(); data.append('image', file); if (form.imagen) data.append('previousFileName', form.imagen); const upload = unwrap(await api.create<UploadResponse>('/images/upload', data)); imagen = upload.fileName } await api.update(`/servicios/${form.id}`, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precioBase: Number(form.precioBase), duracionMinutos: Number(form.duracionMinutos), especialidadId: form.especialidadId, imagen }); navigate(`/servicios/${form.id}`) } catch (cause) { setError(messageFrom(cause)) } finally { setSaving(false) } }
  if (!form) return <section className="page-shell"><div className="empty-state">{error ? <p>{error}</p> : <><LoaderCircle className="spin" size={24} /><p>Cargando servicio...</p></>}</div></section>
  return <section className="page-shell"><Link className="back-link" to={`/servicios/${form.id}`}><ArrowLeft size={14} /> Volver al detalle</Link><div className="section-heading"><div><p className="eyebrow">Catálogo</p><h1>Editar servicio</h1><p className="lead">Actualizá la información y, si querés, reemplazá la imagen.</p></div></div><form className="service-form panel" onSubmit={submit}><label>Nombre *<input value={form.nombre} onChange={event => update('nombre', event.target.value)} required /></label><label>Descripción *<textarea value={form.descripcion} onChange={event => update('descripcion', event.target.value)} required /></label><div className="form-grid"><label>Precio base *<input type="number" min="0.01" value={form.precioBase} onChange={event => update('precioBase', Number(event.target.value))} required /></label><label>Duración *<input type="number" min="15" value={form.duracionMinutos} onChange={event => update('duracionMinutos', Number(event.target.value))} required /></label></div><label className="upload-box"><ImagePlus size={22} /><span>{file ? file.name : 'Reemplazar imagen'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => selectFile(event.target.files?.[0] || null)} /></label>{(preview || form.imagen) && <img className="image-preview" src={preview || `${apiUrl}/images/download/${form.imagen}`} alt="Imagen del servicio" />}{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></form></section>
}
