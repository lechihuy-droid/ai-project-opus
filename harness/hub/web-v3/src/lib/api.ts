export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('k')
  if (token) {
    window.sessionStorage.setItem('hubToken', token)
    url.searchParams.delete('k')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiRequest(path, init)
  return response.json() as Promise<T>
}

export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem('hubToken')
    if (token) headers.set('X-Hub-Token', token)
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, { ...init, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { const body = await response.json() as { detail?: string; message?: string }; message = body.detail ?? body.message ?? message } catch { /* plain error response */ }
    throw new ApiError(response.status, message)
  }
  return response
}
