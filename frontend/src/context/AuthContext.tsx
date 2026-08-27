// Hooks de React: estado, memoria y el tipo de los elementos hijos.
import { useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../services/api'
import { AuthContext, type Role, type AuthUser } from './auth-context'
export type { Role } from './auth-context'

type LoginData = { token: string }
type ProfileData = { id: number; nombre: string; correo: string; rol?: { nombre: Role } }
type ApiEnvelope<T> = { data: T }

// Contexto de autenticación (patrón recomendado por el enunciado).
// Guarda el usuario y el token en sessionStorage para sobrevivir recargas y
// expone login()/logout(). El ROL que llega aquí es el que decide qué ve
// cada usuario (ver ProtectedRoute / RoleRoute y el menú del layout).
export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado inicial: se rehidrata desde sessionStorage si ya había sesión.
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = sessionStorage.getItem('citas_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  // useMemo evita crear estas funciones de nuevo en cada render.
  const value = useMemo(() => ({
    user,
    loading,

    // async indica que esta función trabaja con operaciones que tardan.
    // Una función async siempre devuelve una Promise.
    async login(correo: string, clave: string) {
      setLoading(true)

      try {
        // await espera la respuesta del API sin bloquear toda la interfaz.
        // La Promise representa una operación pendiente: éxito o error.
        const response = await apiRequest<ApiEnvelope<LoginData>>('/usuarios/login', {
          method: 'POST',
          body: JSON.stringify({ correo, password: clave }),
        })

        // El token permite que el API reconozca al usuario en futuras peticiones.
        sessionStorage.setItem('citas_token', response.data.token)

        // Se consulta el perfil para obtener nombre, correo y rol real.
        const profileResponse = await apiRequest<ApiEnvelope<ProfileData>>('/usuarios/perfil')
        const profile = profileResponse.data
        const next: AuthUser = {
          id: profile.id,
          nombre: profile.nombre,
          correo: profile.correo,
          rol: profile.rol?.nombre || 'Cliente',
        }

        // Se guarda la sesión y se actualiza el estado global.
        sessionStorage.setItem('citas_user', JSON.stringify(next))
        setUser(next)
      } finally {
        // Se ejecuta tanto si el login funciona como si falla.
        setLoading(false)
      }
    },

    // logout elimina las credenciales y devuelve la aplicación a estado anónimo.
    logout() {
      sessionStorage.removeItem('citas_token')
      sessionStorage.removeItem('citas_user')
      setUser(null)
    },
  }), [user, loading])

  // Provider comparte user, loading, login y logout con todos los componentes.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
