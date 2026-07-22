import { useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../lib/api'
import Chart, { ChartEmpty } from '../lib/Chart'
import Table from '../lib/Table'
import { Button, Select } from '../lib/ui'

type Num = number | null | undefined
type ModelRow = { model?: string; calls?: Num; input_tokens?: Num; output_tokens?: Num; total_tokens?: Num; cache_tokens?: Num; estimated_cost_usd?: Num; unpriced_tokens?: Num }
type SourceRow = { source?: string; calls?: Num; total_tokens?: Num; estimated_cost_usd?: Num; unpriced_tokens?: Num }
type DayRow = { day?: string; calls?: Num; total_tokens?: Num; estimated_cost_usd?: Num }
type Totals = { calls?: Num; input_tokens?: Num; output_tokens?: Num; total_tokens?: Num; cache_tokens?: Num; cache_read_tokens?: Num; cache_creation_tokens?: Num; estimated_cost_usd?: Num; unpriced_tokens?: Num }
type Rollup = { totals?: Totals; by_model?: ModelRow[]; by_day?: DayRow[]; by_source?: SourceRow[] }
type Event = { ts?: string; source?: string; model?: string; total_tokens?: Num; calls?: Num; session?: string; command?: string }
type Provider = { provider?: string; calls?: Num; total_tokens?: Num; quota_pct?: Num }
type Cockpit = { today?: { by_provider?: Provider[]; calls?: Num }; quota_warn_per_day?: Num; providers_online?: { id: string; available: boolean }[] }
type Row = Record<string, unknown>
type Range = 'today' | '7d' | '30d' | 'all'

const emptyRollup: Rollup = { totals: {} }
const fmt = (value: Num) => value == null ? 'Ã¢â‚¬â€' : new Intl.NumberFormat('vi-VN').format(value)
const compact = (value: Num) => value == null ? 'Ã¢â‚¬â€' : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
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
const price = (value: Num) => typeof value === 'number' ? `~$${value.toFixed(2)}` : null
const costLabel = (cost: Num, unpriced: Num, total: Num) => {
  if (typeof total === 'number' && typeof unpriced === 'number' && unpriced >= total) return 'chÃ†Â°a cÃƒÂ³ giÃƒÂ¡'
  const amount = price(cost) ?? 'chÃ†Â°a cÃƒÂ³ giÃƒÂ¡'
  if (typeof total === 'number' && total > 0 && typeof unpriced === 'number' && unpriced > 0) return `${amount} Ã‚Â· ${pct((total - unpriced) / total)} cÃƒÂ³ giÃƒÂ¡`
  return amount
}
const rowsOf = (data: unknown): Row[] => Array.isArray(data) ? data as Row[] : []
const value = (item: unknown) => typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item ?? 'Ã¢â‚¬â€')

export default function UsagePage() {
  const [range, setRange] = useState<Range>('7d')
  const [source, setSource] = useState('')
  const [model, setModel] = useState('')
  const [rollup, setRollup] = useState<Rollup>(emptyRollup)
  const [cockpit, setCockpit] = useState<Cockpit | null>(null)
  const [events, setEvents] = useState<Event[] | null>(null)
  const [secondary, setSecondary] = useState<Record<string, unknown>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [logLoading, setLogLoading] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState<keyof DayRow>('total_tokens')

  const filter = useMemo(() => query(range, source, model), [range, source, model])
  useEffect(() => {
    let alive = true
    setError('')
    setLoading(true)
    void Promise.allSettled([api<Rollup>(`/api/usage/rollup${filter}`), api<Cockpit>('/api/usage/cockpit')]).then(([r, c]) => {
      if (!alive) return
      if (r.status === 'fulfilled') setRollup(r.value)
      if (c.status === 'fulfilled') setCockpit(c.value)
      const rejected = [r, c].find(item => item.status === 'rejected')
      if (rejected) setError(rejected.reason instanceof ApiError ? rejected.reason.message : 'KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i usage')
      setLoading(false)
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
    setLogLoading(true)
    setEvents(null)
    void api<Event[]>(`/api/usage${filter}`).then(data => { if (alive) setEvents(data) }).catch(reason => { if (alive) setError(reason instanceof ApiError ? reason.message : 'KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i nhÃ¡ÂºÂ­t kÃƒÂ½') })
      .finally(() => { if (alive) setLogLoading(false) })
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
    <header><div className="mb-2 text-[length:var(--hub-section-size)] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-faint">GIÃƒÂM SÃƒÂT</div><h1 className="text-[length:var(--hub-title-size)] font-semibold">Usage & chi phÃƒÂ­</h1><p className="text-dim">Ã„ÂiÃ¡Â»Âu tra token, cache vÃƒÂ  chi phÃƒÂ­ Ã†Â°Ã¡Â»â€ºc tÃƒÂ­nh theo thÃ¡Â»Âi gian.</p></header>
    <section className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel p-3"><div className="flex flex-wrap gap-1">{([['today', 'HÃƒÂ´m nay'], ['7d', '7 ngÃƒÂ y'], ['30d', '30 ngÃƒÂ y'], ['all', 'TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£']] as [Range, string][]).map(([id, label]) => <Button variant="ghost" key={id} onClick={() => setRange(id)} className={`rounded border px-3 py-1.5 text-xs ${range === id ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)] text-ink' : 'border-line text-dim hover:bg-panel2'}`}>{label}</Button>)}</div><Select aria-label="LÃ¡Â»Âc source" value={source} onChange={event => setSource(event.target.value)} className="rounded border border-line bg-panel2 px-2 py-1.5 text-xs"><option value="">TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ source</option>{sourceOptions.map(item => <option key={item}>{item}</option>)}</Select><Select aria-label="LÃ¡Â»Âc model" value={model} onChange={event => setModel(event.target.value)} className="max-w-64 rounded border border-line bg-panel2 px-2 py-1.5 text-xs"><option value="">TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ model</option>{modelOptions.map(item => <option key={item}>{item}</option>)}</Select></section>
    {error && <div className="rounded border border-err px-3 py-2 text-xs text-err">{error}</div>}
    <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Kpi label="Tokens" value={loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : compact(totals.total_tokens)} detail={loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : `${compact(totals.input_tokens)} in Ã‚Â· ${compact(totals.output_tokens)} out`}  /><Kpi label="Calls" value={loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : fmt(totals.calls)} detail={loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : sources.map(row => `${row.source}: ${fmt(row.calls)}`).join(' Ã‚Â· ') || 'ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u'}  /><Kpi label="Cache" value={loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : cacheShare == null ? 'Ã¢â‚¬â€' : pct(cacheShare)} detail={loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : `${compact(totals.cache_read_tokens)} Ã„â€˜Ã¡Â»Âc Ã‚Â· ${compact(totals.cache_creation_tokens)} tÃ¡ÂºÂ¡o`}  /><article className="rounded-lg border border-gate bg-panel p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-faint">Ã†Â¯Ã¡Â»â€ºc tÃƒÂ­nh chi phÃƒÂ­</div><div className="mt-2 font-mono text-lg text-gate">{loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : costLabel(totals.estimated_cost_usd, totals.unpriced_tokens, totals.total_tokens)}</div><div className="mt-1 text-[10px] text-dim">Ã†Â°Ã¡Â»â€ºc tÃƒÂ­nh Ã¢â‚¬â€ khÃƒÂ´ng thÃ¡Â»Â±c trÃ¡ÂºÂ£</div><div className="mt-2 border-t border-line pt-2 text-[10px] text-gate">{loading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : coverage == null ? 'Ã„ÂÃ¡Â»â„¢ phÃ¡Â»Â§ giÃƒÂ¡: chÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u' : `ChÃ¡Â»â€° ${pct(coverage)} token cÃƒÂ³ giÃƒÂ¡ Ã‚Â· ${pct(1 - coverage)} chÃ†Â°a cÃƒÂ³ giÃƒÂ¡`}</div></article></section>
    <section className="rounded-lg border border-line bg-panel p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xs font-semibold">Xu hÃ†Â°Ã¡Â»â€ºng theo ngÃƒÂ y</h2><div className="flex gap-1">{([['total_tokens', 'Tokens'], ['calls', 'Calls'], ['estimated_cost_usd', 'Ã†Â¯Ã¡Â»â€ºc tÃƒÂ­nh $']] as [keyof DayRow, string][]).map(([id, label]) => <Button variant="ghost" key={id} onClick={() => setChartMetric(id)} className={`rounded border px-2 py-1 text-[10px] ${chartMetric === id ? 'border-[var(--hub-accent)] text-[var(--hub-accent)]' : 'border-line text-faint'}`}>{label}</Button>)}</div></div>{loading ? <div className="font-mono text-xs text-dim">Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦</div> : days.length ? <Chart rows={days as unknown as Record<string, unknown>[]} labelKey="day" valueKey={chartMetric} height={170}  /> : <ChartEmpty  />}</section>
    <div className="grid gap-4 lg:grid-cols-2"><section><h2 className="mb-2 text-xs font-semibold">Theo model</h2><Table headers={['Model', 'Calls', 'Tokens', 'Cache', 'Chi phÃƒÂ­']}>{loading ? <tr><td colSpan={5} className="px-3 py-2 font-mono text-xs text-dim">Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦</td></tr> : models.length ? models.map((row, index) => <tr key={`${row.model}-${index}`}><td className="px-3 py-2 font-mono text-[11px] text-text">{row.model ?? 'Ã¢â‚¬â€'}</td><td className="px-3 py-2 text-dim">{fmt(row.calls)}</td><td className="px-3 py-2 text-dim">{compact(row.total_tokens)}</td><td className="px-3 py-2 text-dim">{row.cache_tokens == null ? 'Ã¢â‚¬â€' : compact(row.cache_tokens)}</td><td className="px-3 py-2 text-faint">{costLabel(row.estimated_cost_usd, row.unpriced_tokens, row.total_tokens)}</td></tr>) : <tr><td colSpan={5} className="px-3 py-2 text-xs text-faint">ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u</td></tr>}</Table></section><section><h2 className="mb-2 text-xs font-semibold">Theo provider</h2><Table headers={['Source', 'Calls', 'Tokens', 'Chi phÃƒÂ­', 'Quota']}>{loading ? <tr><td colSpan={5} className="px-3 py-2 font-mono text-xs text-dim">Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦</td></tr> : sources.length ? sources.map((row, index) => { const quota = providers.find(item => item.provider === row.source)?.quota_pct; const isOnline = online.find(item => item.id === row.source)?.available; return <tr key={`${row.source}-${index}`}><td className="px-3 py-2 font-mono text-[11px] text-text">{row.source ?? 'Ã¢â‚¬â€'} <span className="text-faint">{isOnline === false ? 'offline' : ''}</span></td><td className="px-3 py-2 text-dim">{fmt(row.calls)}</td><td className="px-3 py-2 text-dim">{compact(row.total_tokens)}</td><td className="px-3 py-2 text-faint">{costLabel(row.estimated_cost_usd, row.unpriced_tokens, row.total_tokens)}</td><td className="px-3 py-2 text-dim">{quota == null ? 'Ã¢â‚¬â€' : <div><span>{pct(quota)}</span><div className="mt-1 h-1 w-20 rounded bg-panel2"><div className="h-1 rounded bg-gate" style={{ width: `${Math.min(100, quota * 100)}%` }}  /></div></div>}</td></tr> }) : <tr><td colSpan={5} className="px-3 py-2 text-xs text-faint">ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u</td></tr>}</Table></section></div>
    <details open={logOpen} onToggle={event => setLogOpen(event.currentTarget.open)} className="rounded-lg border border-line bg-panel p-4"><summary className="cursor-pointer text-xs font-semibold">NhÃ¡ÂºÂ­t kÃƒÂ½ <span className="ml-1 text-faint">{logLoading ? 'Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦' : events ? `hiÃ¡Â»Æ’n thÃ¡Â»â€¹ ${Math.min(200, events.length)}/${events.length}` : 'mÃ¡Â»Å¸ Ã„â€˜Ã¡Â»Æ’ tÃ¡ÂºÂ£i'}</span></summary><div className="mt-3">{logLoading ? <div className="font-mono text-xs text-dim">Ã„Âang tÃ¡ÂºÂ£iÃ¢â‚¬Â¦</div> : events ? events.length ? <Table headers={['ThÃ¡Â»Âi gian', 'Source', 'Model', 'Tokens', 'Calls', 'Session', 'Command']}>{events.slice(0, 200).map((row, index) => <tr key={`${row.ts}-${index}`}><td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-faint">{row.ts ?? 'Ã¢â‚¬â€'}</td><td className="px-3 py-2 text-dim">{row.source ?? 'Ã¢â‚¬â€'}</td><td className="px-3 py-2 font-mono text-[10px] text-dim">{row.model ?? 'Ã¢â‚¬â€'}</td><td className="px-3 py-2 text-dim">{fmt(row.total_tokens)}</td><td className="px-3 py-2 text-dim">{fmt(row.calls)}</td><td className="max-w-48 truncate px-3 py-2 font-mono text-[10px] text-faint">{row.session ?? 'Ã¢â‚¬â€'}</td><td className="max-w-64 truncate px-3 py-2 text-[10px] text-faint">{row.command ?? 'Ã¢â‚¬â€'}</td></tr>)}</Table> : <div className="text-xs text-faint">ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u</div> : <div className="text-xs text-faint">MÃ¡Â»Å¸ mÃ¡Â»Â¥c nÃƒÂ y Ã„â€˜Ã¡Â»Æ’ tÃ¡ÂºÂ£i event thÃƒÂ´ theo bÃ¡Â»â„¢ lÃ¡Â»Âc hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i.</div>}</div></details>
    <div className="space-y-2"><Secondary title="CÃƒÂ´ng cÃ¡Â»Â¥" data={secondary.tools}  /><Secondary title="Suites" data={secondary.suites}  /><Secondary title="Inspect" data={secondary.inspect}  /></div>
  </div>
}

function Kpi({ label, value: amount, detail }: { label: string; value: string; detail: string }) { return <article className="rounded-lg border border-line bg-panel p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</div><div className="mt-2 font-mono text-lg text-text">{amount}</div><div className="mt-1 text-[10px] text-dim">{detail}</div></article> }
function Secondary({ title, data }: { title: string; data: unknown }) { const rows = rowsOf(data); const headers = [...new Set(rows.flatMap(row => Object.keys(row)))].slice(0, 6); return <details className="rounded-lg border border-line bg-panel p-3"><summary className="cursor-pointer text-xs font-semibold">{title}</summary><div className="mt-3">{rows.length && headers.length ? <Table headers={headers}>{rows.map((row, index) => <tr key={index}>{headers.map(header => <td key={header} className="max-w-xs truncate px-3 py-2 text-[10px] text-dim">{value(row[header])}</td>)}</tr>)}</Table> : <div className="text-xs text-faint">ChÃ†Â°a cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u.</div>}</div></details> }




