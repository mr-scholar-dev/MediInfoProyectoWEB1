import { Navigate, Outlet } from 'react-router-dom'; import { useAuth } from '../../context/useAuth'; import type { Role } from '../../context/AuthContext'
export function RoleRoute({ allowed }: { allowed: Role[] }) { const { user } = useAuth(); return user && allowed.includes(user.rol) ? <Outlet /> : <Navigate to="/" replace /> }
