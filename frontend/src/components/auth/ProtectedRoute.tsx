import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
// Ruta protegida: si no hay sesión, redirige al login (y recuerda a dónde
// quería ir para volver después). Envuelve a todas las páginas privadas.
export function ProtectedRoute() { const { user } = useAuth(); const location = useLocation(); return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }
