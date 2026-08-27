// Layout privado de la aplicación: organiza el menú, el encabezado y el contenido.
// Se muestra después de iniciar sesión y adapta el menú según el rol del usuario.
import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, Scissors, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { formatToday } from '../../lib/date'

const links = [
  // Cada enlace indica la ruta, el texto, el icono y los roles autorizados.
  { to: '/', label: 'Resumen', icon: LayoutDashboard, roles: ['Administrador', 'Empleado', 'Cliente'] },
  { to: '/citas', label: 'Citas', icon: CalendarDays, roles: ['Administrador', 'Empleado', 'Cliente'] },
  { to: '/servicios', label: 'Servicios', icon: Scissors, roles: ['Administrador', 'Empleado', 'Cliente'] },
  { to: '/adicionales', label: 'Adicionales', icon: Scissors, roles: ['Administrador', 'Empleado', 'Cliente'] },
  { to: '/especialidades', label: 'Especialidades', icon: ClipboardList, roles: ['Administrador', 'Empleado', 'Cliente'] },
  { to: '/roles', label: 'Roles', icon: ClipboardList, roles: ['Administrador'] },
  { to: '/estados-cita', label: 'Estados de cita', icon: ClipboardList, roles: ['Administrador', 'Empleado', 'Cliente'] },
  { to: '/empleados', label: 'Empleados', icon: Users, roles: ['Administrador'] },
  { to: '/horarios', label: 'Horarios', icon: ClipboardList, roles: ['Administrador'] },
  { to: '/restricciones', label: 'Restricciones', icon: ClipboardList, roles: ['Administrador'] },
  { to: '/agenda', label: 'Agenda diaria', icon: ClipboardList, roles: ['Administrador'] },
  { to: '/perfil', label: 'Mi perfil', icon: Users, roles: ['Administrador', 'Empleado', 'Cliente'] },
]

export function AppLayout() {
  // Controla la apertura del menú lateral en pantallas pequeñas.
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()

  // Solo se muestran opciones permitidas para el rol autenticado.
  const visibleLinks = links.filter(link => user && link.roles.includes(user.rol))

  return (
    <div className="app-frame">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        {/* Marca de la aplicación y botón para cerrar el menú móvil. */}
        <div className="brand">
          <img className="brand-logo" src="/iconoMediCRcolores.png" alt="MediInfo" />
          <div>
            <strong>MediInfo</strong>
            <span>Gestión de citas</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="workspace-label">Espacio de trabajo</div>
        {/* NavLink marca automáticamente la ruta que está activa. */}
        <nav className="side-nav">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {/* Resumen visual del usuario que tiene la sesión iniciada. */}
          <div className="user-mini">
            <div className="avatar">{user?.nombre[0]?.toUpperCase()}</div>
            <div>
              <strong>{user?.nombre}</strong>
              <span>{user?.rol}</span>
            </div>
          </div>
          {/* logout limpia la sesión y devuelve al usuario al login. */}
          <button className="logout-button" onClick={logout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Encabezado común de las páginas privadas. */}
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="topbar-context">
            <span>Centro de atención</span>
            <strong>Panel de control</strong>
          </div>
          <div className="topbar-date">{formatToday()}</div>
        </header>
        {/* Outlet renderiza aquí la página asociada a la ruta actual. */}
        <Outlet />
      </main>
    </div>
  )
}
