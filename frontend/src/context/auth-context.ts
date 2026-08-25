import { createContext } from 'react'
export type Role = 'Administrador' | 'Empleado' | 'Cliente'
export type AuthUser = { id: number; nombre: string; correo: string; rol: Role }
export type AuthContextValue = { user: AuthUser | null; login: (correo: string, clave: string) => Promise<void>; logout: () => void; loading: boolean }
export const AuthContext = createContext<AuthContextValue | null>(null)
