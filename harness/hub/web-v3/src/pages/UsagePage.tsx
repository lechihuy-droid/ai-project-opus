import { useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../lib/api'
import Chart, { ChartEmpty } from '../lib/Chart'
import Table from '../lib/Table'

type Num = number | null | undefined
type ModelRow = { model?: string; calls?: Num; input_tokens?: Num; output_tokens?: Num; total_tokens?: Num; cache_tokens?: Num; estimated_cost_usd?: Num; unpriced_tokens?: Num }
type SourceRow = { source?: string; calls?: Num; total_tokens?: Num; estimated_cost_usd?: Num }
type DayRow = { day?: string; calls?: Num; total_tokens?: Num; estimated_cost_usd?: Num }
type Totals = { calls?: Num; input_tokens?: Num; output_tokens?: Num; total_tokens?: Num; cache_tokens?: Num; cache_read_tokens?: Num; cache_creation_tokens?: Num; estimated_cost_usd?: Num; unpriced_tokens?: Num }
type Rollup = { totals?: Totals; by_model?: ModelRow[]; by_day?: DayRow[]; by_source?: SourceRow[] }
type Event = { ts?: string; source?: string; model?: string; total_tokens?: Num; calls?: Num; session?: string; command?: string }
type Provider = { provider?: string; calls?: Num; total_tokens?: Num; quota_pct?: Num }
type Cockpit = { today?: { by_provider?: Provider[]; calls?: Num }; quota_warn_per_day?: Num; providers_online?: { id: string; available: boolean }[] }
type Row = Record<string, unknown>
type Range = 'today' | '7d' | '30d' | 'all'

const emptyRollup: Rollup = { totals: {} }
const fmt = (value: Num) => value == null ? '—' : new Intl.NumberFormat('vi-VN').format(value)
const compact = (value: Num) => value == null ? '—' : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
const pct = (value: number) => `${Math.round(value * 100)}%`
const query = (range: Range, source: string, model: string) => {
  const params = new URLSearchParams()
  if (source) params.set('source', source)
  if (model) params.set('model', model)
  if (range !== 'all') {
    const days = range === 'today' ? 1 : range === '30d' ? 30 : 7
    params.set('since', new Date(Date.now() - days * 86400000).toISOString())
  }
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ''
}
const price = (value: Num) => typeof value === 'number' && value > 0 ? `~$${value.toFixed(2)}` : null
const rowsOf = (data: unknown): Row[] => Array.isArray(data) ? data as Row[] : []
const value = (item: unknown) => typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item ?? '—')

export default function UsagePage() {
  const [range, setRange] = useState<Range>('7d')
  const [source, setSource] = useState('')
  const [model, setModel] = useState('')
  const [rollup, setRollup] = useState<Rollup>(emptyRollup)
  const [cockpit, setCockpit] = useState<Cockpit | null>(null)
  const [events, setEvents] = useState<Event[] | null>(null)
  const [secondary, setSecondary] = useState<Record<string, unknown>>({})
  const [error, setError] = useState('')
  const [logOpen, setLogOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState<keyof DayRow>('total_tokens')

  const filter = query(range, source, model)
  useEffect(() => {
    let alive = true
    setError('')
    void Promise.allSettled([api<Rollup>(`/api/usage/rollup${filter}`), api<Cockpit>('/api/usage/cockpit')]).then(([r, c]) => {
      if (!alive) return
      if (r.status === 'fulfilled') setRollup(r.value)
      if (c.status === 'fulfilled') setCockpit(c.value)
      const rejected = [r, c].find(item => item.status === 'rejected')
      if (rejected) setError(rejected.reason instanceof ApiError ? rejected.reason.message : 'Không thể tải usage')
    })
    return () => { alive = false }
  }, [filter])

  useEffect(() => {
    let alive = true
    void Promise.allSettled(['/api/tools', '/api/suites', '/api/inspect/logs'].map(path => api(path))).then(results => {
      if (!alive) return
      const next: Record<string, unknown> = {}
      results.forEach((result, index) => { if (result.status === 'fulfilled') next[['tools', 'suites', 'inspect'][index]] = result.value })
      setSecondary(next)
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!logOpen) return
    let alive = true
    void api<Event[]>(`/api/usage${filter}`).then(data => { if (alive) setEvents(data) }).catch(reason => { if (alive) setError(reason instanceof ApiError ? reason.message : 'Không thể tải nhật ký') })
    return () => { alive = false }
  }, [filter, logOpen])

  const data = rollup ?? emptyRollup
  const totals = data.totals ?? {}
  const models = data.by_model ?? []
  const sources = data.by_source ?? []
  const days = data.by_day ?? []
  const coverage = totals.total_tokens && totals.unpriced_tokens != null ? Math.max(0, (totals.total_tokens - totals.unpriced_tokens) / totals.total_tokens) : null
  const sourceOptions = useMemo(() => sources.map(row => row.source).filter((item): item is string => Boolean(item)), [sources])
  const modelOptions = useMemo(() => models.map(row => row.model).filter((item): item is string => Boolean(item)), [models])
  const providers = cockpit?.today?.by_provider ?? []
  const online = cockpit?.providers_online ?? []
  const cacheShare = totals.total_tokens && totals.cache_tokens != null ? totals.cache_tokens / totals.total_tokens : null

  return <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-7">
    <header><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-faint">GIÁM SÁT</div><h1 className="text-xl font-semibold">Usage & chi phí</h1><p className="text-dim">Điều tra token, cache và chi phí ước tính theo thời gian.</p></header>
    <section className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel p-3"><div className="flex flex-wrap gap-1">{([['today', 'Hôm nay'], ['7d', '7 ngày'], ['30d', '30 ngày'], ['all', 'Tất cả']] as [Range, string][]).map(([id, label]) => <button key={id} onClick={() => setRange(id)} className={`rounded border px-3 py-1.5 text-xs ${range === id ? 'border-codex bg-codex text-ink' : 'border-line text-dim hover:bg-panel2'}`}>{label}</button>)}</div><select aria-label="Lọc source" value={source} onChange={event => setSource(event.target.value)} className="rounded border border-line bg-panel2 px-2 py-1.5 text-xs"><option value="">Tất cả source</option>{sourceOptions.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Lọc model" value={model} onChange={event => setModel(event.target.value)} className="max-w-64 rounded border border-line bg-panel2 px-2 py-1.5 text-xs"><option value="">Tất cả model</option>{modelOptions.map(item => <option key={item}>{item}</option>)}</select></section>
    {error && <div className="rounded border border-err px-3 py-2 text-xs text-err">{error}</div>}
    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Kpi label="Tokens" value={compact(totals.total_tokens)} detail={`${compact(totals.input_tokens)} in · ${compact(totals.output_tokens)} out`} /><Kpi label="Calls" value={fmt(totals.calls)} detail={sources.map(row => `${row.source}: ${fmt(row.calls)}`).join(' · ') || 'Chưa có dữ liệu'} /><Kpi label="Cache" value={cacheShare == null ? '—' : pct(cacheShare)} detail={`${compact(totals.cache_read_tokens)} đọc · ${compact(totals.cache_creation_tokens)} tạo`} /><article className="rounded-lg border border-gate bg-panel p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-faint">Ước tính chi phí</div><div className="mt-2 font-mono text-lg text-gate">{price(totals.estimated_cost_usd) ?? 'chưa xác định'}</div><div className="mt-1 text-[10px] text-dim">ước tính — không thực trả</div><div className="mt-2 border-t border-line pt-2 text-[10px] text-gate">{coverage == null ? 'Độ phủ giá: chưa có dữ liệu' : `Chỉ ${pct(coverage)} token có giá · ${pct(1 - coverage)} chưa có giá`}</div></article></section>
    <section className="rounded-lg border border-line bg-panel p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold">Xu hướng theo ngày</h2><div className="flex gap-1">{([['total_tokens', 'Tokens'], ['calls', 'Calls'], ['estimated_cost_usd', 'Ước tính $']] as [keyof DayRow, string][]).map(([id, label]) => <button key={id} onClick={() => setChartMetric(id)} className={`rounded border px-2 py-1 text-[10px] ${chartMetric === id ? 'border-codex text-codex' : 'border-line text-faint'}`}>{label}</button>)}</div></div>{days.length ? <Chart rows={days as unknown as Record<string, unknown>[]} labelKey="day" valueKey={chartMetric} height={170} /> : <ChartEmpty />}</section>
    <div className="grid gap-4 lg:grid-cols-2"><section><h2 className="mb-2 text-xs font-semibold">Theo model</h2><Table headers={['Model', 'Calls', 'Tokens', 'Cache', 'Chi phí']}>{models.map((row, index) => <tr key={`${row.model}-${index}`}><td className="px-3 py-2 font-mono text-[11px] text-text">{row.model ?? '—'}</td><td className="px-3 py-2 text-dim">{fmt(row.calls)}</td><td className="px-3 py-2 text-dim">{compact(row.total_tokens)}</td><td className="px-3 py-2 text-dim">{row.cache_tokens == null ? '—' : compact(row.cache_tokens)}</td><td className="px-3 py-2 text-faint">{price(row.estimated_cost_usd) ?? 'chưa có giá'}</td></tr>)}</Table></section><section><h2 className="mb-2 text-xs font-semibold">Theo provider</h2><Table headers={['Source', 'Calls', 'Tokens', 'Chi phí', 'Quota']}>{sources.map((row, index) => { const quota = providers.find(item => item.provider === row.source)?.quota_pct; const isOnline = online.find(item => item.id === row.source)?.available; return <tr key={`${row.source}-${index}`}><td className="px-3 py-2 font-mono text-[11px] text-text">{row.source ?? '—'} <span className="text-faint">{isOnline === false ? 'offline' : ''}</span></td><td className="px-3 py-2 text-dim">{fmt(row.calls)}</td><td className="px-3 py-2 text-dim">{compact(row.total_tokens)}</td><td className="px-3 py-2 text-faint">{price(row.estimated_cost_usd) ?? 'chưa có giá'}</td><td className="px-3 py-2 text-dim">{quota == null ? '—' : <div><span>{pct(quota)}</span><div className="mt-1 h-1 w-20 rounded bg-panel2"><div className="h-1 rounded bg-gate" style={{ width: `${Math.min(100, quota * 100)}%` }} /></div></div>}</td></tr> })}</Table></section></div>
    <details open={logOpen} onToggle={event => setLogOpen(event.currentTarget.open)} className="rounded-lg border border-line bg-panel p-4"><summary className="cursor-pointer text-xs font-semibold">Nhật ký <span className="ml-1 text-faint">{events ? `hiển thị ${Math.min(200, events.length)}/${events.length}` : 'mở để tải'}</span></summary><div className="mt-3">{events ? <Table headers={['Thời gian', 'Source', 'Model', 'Tokens', 'Calls', 'Session', 'Command']}>{events.slice(0, 200).map((row, index) => <tr key={`${row.ts}-${index}`}><td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-faint">{row.ts ?? '—'}</td><td className="px-3 py-2 text-dim">{row.source ?? '—'}</td><td className="px-3 py-2 font-mono text-[10px] text-dim">{row.model ?? '—'}</td><td className="px-3 py-2 text-dim">{fmt(row.total_tokens)}</td><td className="px-3 py-2 text-dim">{fmt(row.calls)}</td><td className="max-w-48 truncate px-3 py-2 font-mono text-[10px] text-faint">{row.session ?? '—'}</td><td className="max-w-64 truncate px-3 py-2 text-[10px] text-faint">{row.command ?? '—'}</td></tr>)}</Table> : <div className="text-xs text-faint">Mở mục này để tải event thô theo bộ lọc hiện tại.</div>}</div></details>
    <div className="space-y-2"><Secondary title="Công cụ" data={secondary.tools} /><Secondary title="Suites" data={secondary.suites} /><Secondary title="Inspect" data={secondary.inspect} /></div>
  </div>
}

function Kpi({ label, value: amount, detail }: { label: string; value: string; detail: string }) { return <article className="rounded-lg border border-line bg-panel p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</div><div className="mt-2 font-mono text-lg text-text">{amount}</div><div className="mt-1 text-[10px] text-dim">{detail}</div></article> }
function Secondary({ title, data }: { title: string; data: unknown }) { const rows = rowsOf(data); const headers = [...new Set(rows.flatMap(row => Object.keys(row)))].slice(0, 6); return <details className="rounded-lg border border-line bg-panel p-3"><summary className="cursor-pointer text-xs font-semibold">{title}</summary><div className="mt-3">{rows.length && headers.length ? <Table headers={headers}>{rows.map((row, index) => <tr key={index}>{headers.map(header => <td key={header} className="max-w-xs truncate px-3 py-2 text-[10px] text-dim">{value(row[header])}</td>)}</tr>)}</Table> : <div className="text-xs text-faint">Chưa có dữ liệu.</div>}</div></details> }
