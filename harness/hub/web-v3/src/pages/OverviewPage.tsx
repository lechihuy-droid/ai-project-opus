import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../lib/api'

type Run = { run_id: string; thread_id?: string; status?: string; messages?: unknown[]; interrupts?: unknown[] }
const cards = [['Workflows', '/api/workflows', '/workflows'], ['Agents', '/api/agents', '/agents'], ['Skills', '/api/skill-library', '/skills'], ['Runs', '/api/agent/runs', '/runs'], ['Providers online', '/api/providers', '/settings']] as const
const message = (error: unknown) => error instanceof ApiError ? error.message : 'Không thể tải dữ liệu'

export default function OverviewPage() {
  const [counts, setCounts] = useState<Record<string, number | string>>({}); const [errors, setErrors] = useState<Record<string, string>>({}); const [runs, setRuns] = useState<Run[]>([]); const [runsError, setRunsError] = useState('')
  useEffect(() => {
    cards.forEach(([label, endpoint]) => {
      void api<Array<{ available?: boolean }>>(endpoint).then(rows => {
        const count = label === 'Providers online' ? rows.filter(row => row.available).length : rows.length
        setCounts(current => ({ ...current, [label]: count }))
      }).catch(error => setErrors(current => ({ ...current, [label]: message(error) })))
    })
    void api<Run[]>('/api/agent/runs').then(setRuns).catch(error => setRunsError(message(error)))
  }, [])
  return <div className="flex h-full min-h-0 flex-col gap-space-4 p-space-6"><div><h1 className="text-title font-semibold text-primary">Overview</h1><p className="mt-space-1 text-caption text-secondary">Tổng quan từ các endpoint hiện có.</p></div><div className="grid grid-cols-1 gap-space-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, , to]) => <Link key={label} to={to} className="rounded-lg border border-border-subtle bg-surface p-space-4 no-underline hover:bg-hover"><div className="text-caption text-secondary">{label}</div>{errors[label] ? <div className="mt-space-2 text-caption text-error">{errors[label]}</div> : <div className="mt-space-2 text-title font-semibold text-primary">{counts[label] ?? '…'}</div>}</Link>)}</div><section className="min-h-0 flex-1 overflow-auto rounded-lg border border-border-subtle bg-surface"><div className="border-b border-border-subtle p-space-3"><h2 className="text-label font-semibold text-primary">Runs gần đây</h2></div>{runsError ? <p className="p-space-4 text-caption text-error">{runsError}</p> : <table className="w-full min-w-[600px] text-left"><thead className="sticky top-0 bg-surface"><tr className="border-b border-border-subtle text-caption text-muted">{['id', 'thread', 'status', 'messages'].map(head => <th key={head} className="p-space-3 font-medium">{head}</th>)}</tr></thead><tbody>{runs.slice(0, 8).map(run => <tr key={run.run_id} className="border-b border-border-subtle hover:bg-hover"><td className="p-space-3 font-mono text-caption"><Link className="text-primary" to="/runs">{run.run_id}</Link></td><td className="p-space-3 font-mono text-caption text-secondary">{run.thread_id ?? '—'}</td><td className="p-space-3 text-caption text-secondary">{run.status ?? '—'}</td><td className="p-space-3 text-caption text-secondary">{run.messages?.length ?? '—'}</td></tr>)}</tbody></table>}</section></div>
}
