import { Eye, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

export type CatalogColumn<T> = { label: string; render: (item: T) => React.ReactNode }
export type CatalogSortOption<T> = { label: string; compare: (a: T, b: T) => number }
type Props<T extends { id: number }> = { title: string; eyebrow: string; description: string; endpoint: string; columns: CatalogColumn<T>[]; empty: string; detailBasePath?: string; createPath?: string; searchText?: (item: T) => string; sortOptions?: CatalogSortOption<T>[] }
function unwrap<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
function nameOf(item: unknown): string { const record = item as Record<string, unknown>; return String(record.nombre ?? record.titulo ?? record.title ?? record.name ?? '') }

export function CatalogPage<T extends { id: number }>({ title, eyebrow, description, endpoint, columns, empty, detailBasePath, createPath, searchText, sortOptions }: Props<T>) {
  const [items, setItems] = useState<T[]>([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [sortIndex, setSortIndex] = useState(0)
  const sorters = useMemo<CatalogSortOption<T>[]>(() => sortOptions ?? [
    { label: 'Nombre (A-Z)', compare: (a, b) => nameOf(a).localeCompare(nameOf(b), 'es') },
    { label: 'Nombre (Z-A)', compare: (a, b) => nameOf(b).localeCompare(nameOf(a), 'es') },
  ], [sortOptions])
  useEffect(() => { api.list<T[] | { data: T[] }>(endpoint).then(result => setItems(unwrap(result) || [])).catch(cause => setError(cause instanceof Error ? cause.message : 'No se pudo cargar la información.')).finally(() => setLoading(false)) }, [endpoint])
  const filtered = useMemo(() => { const normalized = query.trim().toLowerCase(); return normalized ? items.filter(item => (searchText ? searchText(item) : JSON.stringify(item)).toLowerCase().includes(normalized)) : items }, [items, query, searchText])
  const sorted = useMemo(() => { const sorter = sorters[sortIndex] ?? sorters[0]; return sorter ? [...filtered].sort(sorter.compare) : filtered }, [filtered, sorters, sortIndex])
  return <section className="page-shell"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{description}</p></div>{createPath && <Link className="primary-button" to={createPath}>Nuevo registro</Link>}</div><div className="toolbar"><div className="search-control"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} /></div><label className="sort-control">Ordenar por<select value={sortIndex} onChange={event => setSortIndex(Number(event.target.value))}>{sorters.map((option, index) => <option key={option.label} value={index}>{option.label}</option>)}</select></label><span className="results-count">{filtered.length} registros</span></div>{loading && <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando información...</p></div>}{error && <div className="empty-state"><h2>No se pudo cargar la información</h2><p>{error}</p></div>}{!loading && !error && filtered.length === 0 && <div className="empty-state"><h2>{items.length ? 'No hay coincidencias' : empty}</h2><p>{items.length ? 'Probá con otro término de búsqueda.' : 'El API no devolvió registros para este módulo.'}</p></div>}{!loading && !error && filtered.length > 0 && <div className="table-panel"><table><thead><tr>{columns.map(column => <th key={column.label}>{column.label}</th>)}<th>Detalle</th></tr></thead><tbody>{sorted.map(item => <tr key={item.id}>{columns.map(column => <td key={column.label}>{column.render(item)}</td>)}<td>{detailBasePath ? <Link className="icon-button" to={`${detailBasePath}/${item.id}`} aria-label={`Ver detalle de ${title.toLowerCase()}`}><Eye size={17} /></Link> : <span className="icon-button" aria-hidden="true"><Eye size={17} /></span>}</td></tr>)}</tbody></table></div>}</section>
}
