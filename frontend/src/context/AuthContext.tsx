import { useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../services/api'
import { AuthContext, type Role, type AuthUser } from './auth-context'
export type { Role } from './auth-context'

type LoginData = { token: string }
type ProfileData = { id: number; nombre: string; correo: string; rol?: { nombre: Role } }
type ApiEnvelope<T> = { data: T }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => { const saved = sessionStorage.getItem('citas_user'); return saved ? JSON.parse(saved) : null })
  const [loading, setLoading] = useState(false)
  const value = useMemo(() => ({ user, loading, async login(correo: string, clave: string) { setLoading(true); try { const response = await apiRequest<ApiEnvelope<LoginData>>('/usuarios/login', { method: 'POST', body: JSON.stringify({ correo, password: clave }) }); sessionStorage.setItem('citas_token', response.data.token); const profileResponse = await apiRequest<ApiEnvelope<ProfileData>>('/usuarios/perfil'); const profile = profileResponse.data; const next: AuthUser = { id: profile.id, nombre: profile.nombre, correo: profile.correo, rol: profile.rol?.nombre || 'Cliente' }; sessionStorage.setItem('citas_user', JSON.stringify(next)); setUser(next) } finally { setLoading(false) } }, logout() { sessionStorage.removeItem('citas_token'); sessionStorage.removeItem('citas_user'); setUser(null) } }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
