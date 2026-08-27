// createContext permite compartir información entre componentes sin pasar props.
import { createContext } from 'react'

// Roles válidos dentro del sistema.
export type Role = 'Administrador' | 'Empleado' | 'Cliente'

// Datos mínimos del usuario autenticado.
export type AuthUser = { id: number; nombre: string; correo: string; rol: Role }

// Contrato del contexto: define qué datos y funciones estarán disponibles.
// login devuelve una Promise porque espera respuestas del API.
export type AuthContextValue = { user: AuthUser | null; login: (correo: string, clave: string) => Promise<void>; logout: () => void; loading: boolean }

// Se inicia en null porque todavía no existe un Provider conectado.
export const AuthContext = createContext<AuthContextValue | null>(null)
