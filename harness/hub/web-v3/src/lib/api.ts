export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

// The token arrives once as ?k= and is kept in localStorage, not sessionStorage:
// sessionStorage is per-tab, so every new tab started with no token and answered
// 403 to everything, which reads as a broken app rather than an unauthenticated
// one. The trade is that the token now outlives the tab and sits in the browser's
// storage on disk. That is acceptable for a tool bound to localhost; it would not
// be if the hub were ever served to another machine.
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('k')
  if (token) {
    window.localStorage.setItem('hubToken', token)
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
    const token = window.localStorage.getItem('hubToken')
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
