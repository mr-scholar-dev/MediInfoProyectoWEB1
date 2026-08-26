import { CatalogPage, type CatalogSortOption } from '../modules/catalog/CatalogPage'
type Employee = { id: number; codigo: string; nombre: string; primerApellido?: string; activo?: boolean; usuario?: { correo: string } }
const fullName = (x: Employee) => `${x.nombre} ${x.primerApellido || ''}`.trim()
const sortOptions: CatalogSortOption<Employee>[] = [
  { label: 'Nombre (A-Z)', compare: (a, b) => fullName(a).localeCompare(fullName(b), 'es') },
  { label: 'Nombre (Z-A)', compare: (a, b) => fullName(b).localeCompare(fullName(a), 'es') },
  { label: 'Estado (activos primero)', compare: (a, b) => Number(b.activo !== false) - Number(a.activo !== false) || fullName(a).localeCompare(fullName(b), 'es') },
  { label: 'Estado (inactivos primero)', compare: (a, b) => Number(a.activo !== false) - Number(b.activo !== false) || fullName(a).localeCompare(fullName(b), 'es') },
]
export function EmployeesPage() { return <CatalogPage<Employee> sortOptions={sortOptions} title="Empleados" eyebrow="Equipo de trabajo" description="Consultá los profesionales y los servicios que tienen asignados." endpoint="/empleados" empty="No hay empleados registrados" detailBasePath="/empleados" createPath="/empleados/nuevo" columns={[{ label: 'Código', render: x => <strong>{x.codigo}</strong> }, { label: 'Nombre', render: x => `${x.nombre} ${x.primerApellido || ''}` }, { label: 'Correo', render: x => x.usuario?.correo || 'Sin correo' }, { label: 'Estado', render: x => <span className={`status ${x.activo === false ? 'status-gray' : 'status-green'}`}>{x.activo === false ? 'Inactivo' : 'Activo'}</span> }]} /> }
