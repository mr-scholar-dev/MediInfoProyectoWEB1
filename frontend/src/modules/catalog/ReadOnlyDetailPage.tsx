import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'

type Props<T> = { title: string; eyebrow: string; endpoint: string; render: (item: T) => ReactNode }
export function ReadOnlyDetailPage<T>({ title, eyebrow, endpoint, render }: Props<T>) {
  const { id } = useParams(); const [item, setItem] = useState<T>(); const [error, setError] = useState('')
  useEffect(() => { if (!id) return; api.get<T>(`${endpoint}/${id}`).then(setItem).catch(cause => setError(cause instanceof Error ? cause.message : 'No se pudo cargar el registro.')) }, [id, endpoint])
  if (!item) return <section className="page-shell"><div className="empty-state">{error ? <><h2>No se pudo cargar el detalle</h2><p>{error}</p></> : <><LoaderCircle className="spin" size={24} /><p>Cargando detalle...</p></>}</div></section>
  return <section className="page-shell narrow-page"><Link className="back-link" to={endpoint === '/horarios-atencion' ? '/horarios' : '/restricciones'}><ArrowLeft size={14} /> Volver</Link><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="detail-card">{render(item)}</div></section>
}
