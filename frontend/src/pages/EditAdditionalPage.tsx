import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdditionalForm } from '../modules/catalog/AdditionalForm'
import { api } from '../services/api'

type Additional = { id: number; nombre: string; descripcion?: string; precio: number; activo?: boolean }

export function EditAdditionalPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Additional>()
  const [error, setError] = useState('')
  useEffect(() => { if (!id) return; api.get<Additional>(`/servicios-adicionales/${id}`).then(setItem).catch(cause => setError((cause as Error).message)) }, [id])
  if (error) return <div className="empty-state"><h2>No se pudo cargar el adicional</h2><p>{error}</p></div>
  if (!item) return <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando adicional...</p></div>
  return <section className="page-shell narrow-page"><p className="eyebrow">Catálogo</p><h1>Editar adicional</h1><AdditionalForm initial={item} edit /><Link className="back-link" to={`/adicionales/${item.id}`}>← Cancelar</Link></section>
}
// Formulario para editar un servicio adicional.
