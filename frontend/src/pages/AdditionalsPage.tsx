import { CatalogPage } from '../modules/catalog/CatalogPage'
type Additional = { id: number; nombre: string; descripcion?: string; precio: number; activo?: boolean }

export function AdditionalsPage() {
  return <CatalogPage<Additional> title="Servicios adicionales" eyebrow="Catálogo" description="Administrá los extras que pueden agregarse a una cita." endpoint="/servicios-adicionales" empty="No hay servicios adicionales registrados" detailBasePath="/adicionales" createPath="/adicionales/nuevo" columns={[{ label: 'Nombre', render: item => <strong>{item.nombre}</strong> }, { label: 'Descripción', render: item => item.descripcion || 'Sin descripción' }, { label: 'Precio', render: item => `₡${Number(item.precio).toLocaleString('es-CR')}` }, { label: 'Estado', render: item => <span className={`status ${item.activo === false ? 'status-gray' : 'status-green'}`}>{item.activo === false ? 'Inactivo' : 'Activo'}</span> }]} />
}
