import { ArrowLeft, Edit3, LoaderCircle, Power } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'

type Additional = { id: number; nombre: string; descripcion?: string; precio: number; activo?: boolean }

export function AdditionalDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Additional>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => { if (!id) return; api.get<Additional>(`/servicios-adicionales/${id}`).then(setItem).catch(cause => setError((cause as Error).message)).finally(() => setLoading(false)) }, [id])

  async function toggle() {
    if (!item) return
    setChanging(true)
    setError('')
    setMessage('')
    try { await api.patch(`/servicios-adicionales/${item.id}/estado`, { activo: item.activo === false }); setItem({ ...item, activo: item.activo === false }); setMessage('Estado actualizado correctamente.') } catch (cause) { setError((cause as Error).message) } finally { setChanging(false) }
  }

  if (loading) return <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando adicional...</p></div>
  if (error || !item) return <div className="empty-state"><h2>No se pudo cargar el adicional</h2><p>{error || 'Registro no encontrado.'}</p><Link className="back-link" to="/adicionales">Volver</Link></div>
  return (
    <section className="page-shell narrow-page">
      <Link className="back-link" to="/adicionales"><ArrowLeft size={16} /> Volver al catálogo</Link>
      <Card className="mt-5 max-w-[560px] gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Servicio adicional</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">{item.nombre}</h1>
          </div>
          <StatusBadge status={item.activo === false ? 'Inactivo' : 'Activo'} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{item.descripcion || 'Sin descripción.'}</p>
        <div className="flex items-center justify-between border-t border-hairline pt-4">
          <span className="text-sm text-muted-foreground">Precio</span>
          <strong className="font-mono text-lg text-brand-bright">₡{Number(item.precio).toLocaleString('es-CR')}</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary"><Link to={`/adicionales/${item.id}/editar`}><Edit3 size={16} /> Editar</Link></Button>
          <Button variant="secondary" onClick={toggle} disabled={changing}><Power size={16} /> {changing ? 'Actualizando...' : item.activo === false ? 'Activar' : 'Desactivar'}</Button>
        </div>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="form-error">{error}</div>}
      </Card>
    </section>
  )
}
