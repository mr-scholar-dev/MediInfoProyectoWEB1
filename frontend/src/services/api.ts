const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'
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
function unwrapResponse<T>(value: T | { data?: T }): T { return (value && typeof value === 'object' && 'data' in value ? value.data : value) as T }
export const api = { list: <T>(path: string) => apiRequest<T>(path), get: async <T>(path: string) => unwrapResponse(await apiRequest<T | { data?: T }>(path)), create: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body: requestBody(body) }), update: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PUT', body: requestBody(body) }), patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PATCH', body: requestBody(body) }) }
