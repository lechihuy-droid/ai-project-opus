import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cicd } from './cicdApi'

describe('cicd client hits the right URLs with the auth header', () => {
  beforeEach(() => {
    window.localStorage.setItem('hubToken', 'secret-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const ok = (body: string) => vi.mocked(fetch).mockResolvedValue(new Response(body, { status: 200 }))

  it('overview() GETs /api/cicd/overview with the token', async () => {
    ok('{}')
    await cicd.overview()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/cicd/overview')
    expect(init?.method ?? 'GET').toBe('GET')
    expect(new Headers(init?.headers).get('X-Hub-Token')).toBe('secret-token')
  })

  it('workflowRuns() omits workflow_id when none is given', async () => {
    ok('[]')
    await cicd.workflowRuns()
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/cicd/workflow-runs?per_page=30')
  })

  it('workflowRuns() passes workflow_id and per_page', async () => {
    ok('[]')
    await cicd.workflowRuns('12', 5)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/cicd/workflow-runs?workflow_id=12&per_page=5')
  })

  it('commits() and activity() send their limits', async () => {
    ok('[]')
    await cicd.commits(20)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/cicd/commits?limit=20')
    ok('[]')
    await cicd.activity(15)
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/cicd/activity?limit=15')
  })

  it('refresh() POSTs', async () => {
    ok('{"ok":true}')
    await cicd.refresh()
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/cicd/refresh')
    expect(init?.method).toBe('POST')
  })

  it('propagates ApiError on a failed response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{"detail":"nope"}', { status: 403 }))
    await expect(cicd.overview()).rejects.toThrow('nope')
  })
})
