import { Navigate, Outlet } from 'react-router-dom'; 
import { useAuth } from '../../context/useAuth'; 
import type { Role } from '../../context/AuthContext'
// Ruta por rol: bloquea el acceso por navegación directa a quien no tenga el
// rol permitido (p. ej. /empleados o /agenda son solo de Administrador).
// Complementa al menú, que ya oculta las opciones no permitidas.
export function RoleRoute({ allowed }: { allowed: Role[] }) { const { user } = useAuth(); return user && allowed.includes(user.rol) ? <Outlet /> : <Navigate to="/" replace /> }
