import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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

  return (
    <form className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-panel)]" onSubmit={submit}>
      <div className="grid gap-2"><Label htmlFor="add-nombre">Nombre *</Label><Input id="add-nombre" value={name} onChange={event => setName(event.target.value)} required /></div>
      <div className="grid gap-2"><Label htmlFor="add-desc">Descripción *</Label><Textarea id="add-desc" value={description} onChange={event => setDescription(event.target.value)} required rows={4} /></div>
      <div className="grid gap-2"><Label htmlFor="add-precio">Precio *</Label><Input id="add-precio" type="number" min="0" step="0.01" value={price} onChange={event => setPrice(event.target.value)} required /></div>
      {error && <div className="form-error">{error}</div>}
      <Button type="submit" disabled={saving} className="justify-self-start">{saving ? 'Guardando...' : edit ? 'Guardar cambios' : 'Crear adicional'}</Button>
    </form>
  )
}
