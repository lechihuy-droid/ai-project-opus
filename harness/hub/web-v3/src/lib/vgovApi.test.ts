import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { vgov } from './vgovApi'

describe('vgov wrappers delegate to apiRequest (auth header, URL, method)', () => {
  beforeEach(() => {
    window.localStorage.setItem('hubToken', 'secret-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('releases() issues a GET to the workflow-scoped URL', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('[]', { status: 200 }))
    await vgov.releases('wf-1')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/vgov/releases?workflow_id=wf-1')
    expect(init?.method ?? 'GET').toBe('GET')
  })

  it('publish() POSTs to the release id and carries the auth token', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
    await vgov.publish('rel-1')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/vgov/releases/rel-1/publish')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('X-Hub-Token')).toBe('secret-token')
  })

  it('content() sends the auth token and returns text, not JSON', async () => {
    // Regression guard: content() used to call fetch() directly instead of
    // apiRequest(), so it never carried X-Hub-Token -- it would 403 once
    // every route was gated behind the hub auth token (P0.1).
    vi.mocked(fetch).mockResolvedValue(new Response('raw markdown body', { status: 200 }))

    const text = await vgov.content('rev-1')

    expect(text).toBe('raw markdown body')
    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/vgov/revisions/rev-1/content')
    expect(new Headers(init?.headers).get('X-Hub-Token')).toBe('secret-token')
  })

  it('content() rejects with ApiError on a non-ok response, same as other calls', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not found', { status: 404 }))

    await expect(vgov.content('missing')).rejects.toMatchObject({ status: 404 })
  })
})
