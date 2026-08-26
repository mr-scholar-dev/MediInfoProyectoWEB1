// ============================================================================
// Capa de servicios: ÚNICO punto de contacto con el API de citas.
// Toda la app consume datos a través de `api.*` (no hay datos locales
// simulados). Centraliza: URL base, token JWT, cabeceras, manejo de errores
// y el "desempaque" del sobre { data } que devuelve el backend.
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'

// Realiza una petición al API. Adjunta el token si existe, usa JSON salvo que
// el cuerpo sea FormData (subida de imágenes), y traduce los errores de
// validación del backend a un mensaje legible que la UI puede mostrar.
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('citas_token')
  const isForm = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } })
  const body = response.status === 204 ? '' : await response.text()
  if (!response.ok) {
    let message = body || `La solicitud falló (${response.status}).`
    try {
      const parsed = JSON.parse(body) as { message?: string; validationErrors?: { message: string }[] }
      message = parsed.validationErrors?.map(error => error.message).join(' ') || parsed.message || message
    } catch {
      // Conserva respuestas no JSON del servidor.
    }
    throw new Error(message)
  }
  return (body ? JSON.parse(body) : undefined) as T
}
const requestBody = (body: unknown) => body instanceof FormData ? body : JSON.stringify(body)
// El backend envuelve las respuestas en { data: ... }; esto devuelve el contenido.
function unwrapResponse<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }

// Fachada por verbo HTTP usada en toda la app:
//  list  -> GET de colección   get -> GET de un registro (desempaca { data })
//  create-> POST               update -> PUT               patch -> PATCH (estados)
export const api = { list: <T>(path: string) => apiRequest<T>(path), get: async <T>(path: string) => unwrapResponse(await apiRequest<T | { data?: T }>(path)), create: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body: requestBody(body) }), update: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PUT', body: requestBody(body) }), patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PATCH', body: requestBody(body) }) }
