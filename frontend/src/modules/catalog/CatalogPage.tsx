import { Eye, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  return (
    <section className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
        </div>
        {createPath && <Button asChild><Link to={createPath}>Nuevo registro</Link></Button>}
      </div>
      <div className="mb-[18px] flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-[340px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} className="pl-9" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Ordenar por</span>
          <Select value={String(sortIndex)} onValueChange={value => setSortIndex(Number(value))}>
            <SelectTrigger className="w-[190px]" size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>{sorters.map((option, index) => <SelectItem key={option.label} value={String(index)}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <span className="ml-auto font-mono text-xs text-text-faint">{filtered.length} registros</span>
      </div>
      {loading && <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Cargando información...</p></div>}
      {error && <div className="empty-state"><h2>No se pudo cargar la información</h2><p>{error}</p></div>}
      {!loading && !error && filtered.length === 0 && <div className="empty-state"><h2>{items.length ? 'No hay coincidencias' : empty}</h2><p>{items.length ? 'Probá con otro término de búsqueda.' : 'El API no devolvió registros para este módulo.'}</p></div>}
      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-panel)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map(column => <TableHead key={column.label}>{column.label}</TableHead>)}
                <TableHead className="w-16 text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(item => (
                <TableRow key={item.id}>
                  {columns.map(column => <TableCell key={column.label}>{column.render(item)}</TableCell>)}
                  <TableCell className="text-right">
                    {detailBasePath ? (
                      <Button asChild variant="ghost" size="icon" aria-label={`Ver detalle de ${title.toLowerCase()}`}>
                        <Link to={`${detailBasePath}/${item.id}`}><Eye size={17} /></Link>
                      </Button>
                    ) : (
                      <span className="inline-flex size-9 items-center justify-center text-text-faint" aria-hidden="true"><Eye size={17} /></span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
