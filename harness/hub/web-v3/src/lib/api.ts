export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

const params = new URLSearchParams(location.search)
const tokenFromUrl = params.get('k')
if (tokenFromUrl) {
  sessionStorage.setItem('hubToken', tokenFromUrl)
  params.delete('k')
  const query = params.toString()
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash)
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiRequest(path, init)
  return response.json() as Promise<T>
}

export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const hubToken = sessionStorage.getItem('hubToken')
  if (hubToken) headers.set('X-Hub-Token', hubToken)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, { ...init, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { const body = await response.json() as { detail?: string; message?: string }; message = body.detail ?? body.message ?? message } catch { /* plain error response */ }
    throw new ApiError(response.status, message)
  }
  return response
}
