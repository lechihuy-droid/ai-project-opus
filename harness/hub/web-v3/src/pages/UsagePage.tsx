import { useEffect, useState } from 'react'
import { ApiError, api } from '../lib/api'
import Table from '../lib/Table'

type Row = Record<string, unknown>
type Cockpit = { today?: { by_provider?: Row[]; calls?: number }; quota_warn_per_day?: number; providers_online?: { id: string; available: boolean }[] }

const colors: Record<string, string> = { claude: 'border-claude text-claude', codex: 'border-codex text-codex', nvidia: 'border-nvidia text-nvidia', gemini: 'border-gemini text-gemini' }
const value = (item: unknown) => typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item ?? '—')

function rowsOf(data: unknown): Row[] { if (Array.isArray(data)) return data as Row[]; if (data && typeof data === 'object') { const found = Object.entries(data as Row).find(([, item]) => Array.isArray(item)); return found ? found[1] as Row[] : [data as Row] }; return [] }
function SmallTable({ data }: { data: unknown }) { const rows = rowsOf(data); const headers = [...new Set(rows.flatMap(row => Object.keys(row)))].slice(0, 6); return rows.length && headers.length ? <Table headers={headers}>{rows.map((row, index) => <tr key={index}>{headers.map(header => <td key={header} className="max-w-xs truncate px-3 py-2 text-[10px] text-dim">{value(row[header])}</td>)}</tr>)}</Table> : <div className="text-xs text-faint">Chưa có dữ liệu.</div> }

export default function UsagePage() {
  const [cockpit, setCockpit] = useState<Cockpit | null>(null)
  const [rollup, setRollup] = useState<unknown>(null)
  const [tools, setTools] = useState<unknown>(null)
  const [suites, setSuites] = useState<unknown>(null)
  const [inspect, setInspect] = useState<unknown>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void Promise.allSettled([
      api<Cockpit>('/api/usage/cockpit'),
      api('/api/usage/rollup'),
      api('/api/tools'),
      api('/api/suites'),
      api('/api/inspect/logs'),
    ]).then(([c, r, t, s, i]) => {
      if (c.status === 'fulfilled') setCockpit(c.value)
      if (r.status === 'fulfilled') setRollup(r.value)
      if (t.status === 'fulfilled') setTools(t.value)
      if (s.status === 'fulfilled') setSuites(s.value)
      if (i.status === 'fulfilled') setInspect(i.value)
      const rejected = [c, r, t, s, i].find(result => result.status === 'rejected')
      if (rejected) {
        const reason = rejected.reason
        setError(reason instanceof ApiError ? reason.message : 'Không thể tải usage')
      }
    })
  }, [])

  const providers = cockpit?.today?.by_provider ?? []
  const online = cockpit?.providers_online ?? []
  const quota = cockpit?.quota_warn_per_day ?? 0
  const rollupRows = rollup && typeof rollup === 'object' ? rollup as Row : {}

  return <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-7"><header><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-faint">GIÁM SÁT</div><h1 className="text-xl font-semibold">Usage & quota</h1><p className="text-dim">Theo dõi token và số lượt gọi theo provider.</p></header>{error && <div className="text-xs text-err">{error}</div>}<section><div className="mb-2 flex items-center gap-2"><h2 className="text-xs font-semibold">Quota hôm nay</h2><span className="text-[10px] text-faint">{cockpit?.today?.calls ?? 0} / {quota || '—'} calls</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{['claude', 'codex', 'nvidia', 'gemini'].map(id => { const row = providers.find(item => item.provider === id); const isOnline = online.find(item => item.id === id)?.available; return <article key={id} className={`rounded-lg border bg-panel p-3 ${colors[id]}`}><div className="flex items-center justify-between text-xs font-semibold"><span>{id}</span><span className="text-[10px] text-faint">{isOnline === false ? 'offline' : 'online'}</span></div><div className="mt-3 font-mono text-lg text-text">{value(row?.total_tokens ?? 0)}</div><div className="text-[10px] text-dim">tokens · {value(row?.calls ?? 0)} calls</div></article> })}</div></section><section><h2 className="mb-2 text-xs font-semibold">Rollup theo source / model</h2><h3 className="mb-1 text-[10px] uppercase tracking-wide text-faint">Source</h3><SmallTable data={rollupRows.by_source} /><h3 className="mb-1 mt-3 text-[10px] uppercase tracking-wide text-faint">Model</h3><SmallTable data={rollupRows.by_model} /></section><div className="space-y-2"><Secondary title="Công cụ" data={tools} /><Secondary title="Suites" data={suites} /><Secondary title="Inspect" data={inspect} /></div></div>
}

function Secondary({ title, data }: { title: string; data: unknown }) { return <details className="rounded-lg border border-line bg-panel p-3"><summary className="cursor-pointer text-xs font-semibold">{title}</summary><div className="mt-3"><SmallTable data={data} /></div></details> }
