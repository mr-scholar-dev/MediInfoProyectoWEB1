// useContext permite leer los datos compartidos por AuthProvider.
import { useContext } from 'react'
import { AuthContext } from './auth-context'

// Hook reutilizable para acceder a user, loading, login y logout.
export function useAuth() {
  const context = useContext(AuthContext)

  // Evita usar el hook en un componente que no tenga acceso al Provider.
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  // Devuelve el contexto listo para ser usado por cualquier componente.
  return context
}
