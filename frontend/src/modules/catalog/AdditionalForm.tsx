import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

type Additional = { id?: number; nombre: string; descripcion?: string; precio: number; activo?: boolean }

type Props = { initial?: Additional; edit?: boolean }

export function AdditionalForm({ initial, edit = false }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState(initial?.nombre || '')
  const [description, setDescription] = useState(initial?.descripcion || '')
  const [price, setPrice] = useState(String(initial?.precio ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !description.trim() || Number(price) < 0) {
      setError('Completá nombre, descripción y un precio válido.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { nombre: name.trim(), descripcion: description.trim(), precio: Number(price) }
      if (edit && initial?.id) await api.update(`/servicios-adicionales/${initial.id}`, payload)
      else await api.create('/servicios-adicionales', payload)
      navigate(edit ? `/adicionales/${initial?.id}` : '/adicionales')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return <form className="service-form" onSubmit={submit}>
    <label>Nombre<input value={name} onChange={event => setName(event.target.value)} required /></label>
    <label>Descripción<textarea value={description} onChange={event => setDescription(event.target.value)} required rows={4} /></label>
    <label>Precio<input type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} required /></label>
    {error && <div className="form-error">{error}</div>}
    <button className="primary-button" disabled={saving}>{saving ? 'Guardando...' : edit ? 'Guardar cambios' : 'Crear adicional'}</button>
  </form>
}
