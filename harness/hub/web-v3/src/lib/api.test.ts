import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('apiRequest error paths', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws ApiError with the server-provided detail message on a non-ok JSON response', async () => {
    const { apiRequest, ApiError } = await import('./api')
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'suite not found' }), { status: 404 }),
    )

    await expect(apiRequest('/api/runs/trigger')).rejects.toMatchObject(
      new ApiError(404, 'suite not found'),
    )
  })

  it('falls back to a generic message when the error body is not valid JSON', async () => {
    const { apiRequest, ApiError } = await import('./api')
    vi.mocked(fetch).mockResolvedValue(new Response('<html>gateway down</html>', { status: 502 }))

    await expect(apiRequest('/api/chat')).rejects.toMatchObject(new ApiError(502, 'Request failed (502)'))
  })

  it('does not throw and returns the response on success', async () => {
    const { apiRequest } = await import('./api')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const response = await apiRequest('/api/health')
    expect(response.ok).toBe(true)
  })

  it('attaches X-Hub-Token from sessionStorage when present', async () => {
    window.sessionStorage.setItem('hubToken', 'secret-token')
    const { apiRequest } = await import('./api')
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await apiRequest('/api/agent/runs')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('X-Hub-Token')).toBe('secret-token')
  })

  it('sends no X-Hub-Token header when sessionStorage has none', async () => {
    const { apiRequest } = await import('./api')
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await apiRequest('/api/agent/runs')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.has('X-Hub-Token')).toBe(false)
  })

  it('sets a JSON Content-Type for a plain object body but not for FormData', async () => {
    const { apiRequest } = await import('./api')
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))

    await apiRequest('/api/artifacts', { body: JSON.stringify({ title: 'x' }) })
    const jsonHeaders = new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers)
    expect(jsonHeaders.get('Content-Type')).toBe('application/json')

    vi.mocked(fetch).mockClear()
    const form = new FormData()
    await apiRequest('/api/chats/1/files', { body: form })
    const formHeaders = new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers)
    expect(formHeaders.has('Content-Type')).toBe(false)
  })
})

describe('module-load token capture from the ?k= query param', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.resetModules()
  })

  it('stores the token from ?k= into sessionStorage and strips it from the URL', async () => {
    window.history.pushState({}, '', '/?k=url-token&other=1')

    await import('./api')

    expect(window.sessionStorage.getItem('hubToken')).toBe('url-token')
    expect(window.location.search).toBe('?other=1')
    expect(window.location.href).not.toContain('k=url-token')
  })

  it('leaves sessionStorage untouched when there is no ?k= param', async () => {
    window.history.pushState({}, '', '/?other=1')

    await import('./api')

    expect(window.sessionStorage.getItem('hubToken')).toBeNull()
  })
})
