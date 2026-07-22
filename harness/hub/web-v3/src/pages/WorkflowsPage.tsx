import { useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../lib/api'

type AgentNode = { id: string; agent: string; prompt: string; gate?: string | null; type?: 'agent' }
type ValidateNode = { id: string; type: 'validate'; target: string; checks: Array<Record<string, unknown>>; on_fail: string }
type Node = AgentNode | ValidateNode
type Workflow = { id: string; nodes: Node[]; edges: Array<[string, string]>; stop: unknown }
type Validation = { ok: boolean; errors: string[]; ir: unknown[] | null }
type Source = { id: string; yaml_text: string }

const isValidate = (node: Node): node is ValidateNode => node.type === 'validate'

function chainOrder(workflow: Workflow): { nodes: Node[]; valid: boolean } {
  const byId = new Map(workflow.nodes.map(node => [node.id, node]))
  const right = new Set(workflow.edges.map(edge => edge[1]))
  const start = workflow.nodes.find(node => !right.has(node.id))
  if (!start) return { nodes: workflow.nodes, valid: false }
  const next = new Map(workflow.edges.map(([from, to]) => [from, to]))
  const ordered: Node[] = []; const seen = new Set<string>(); let current: Node | undefined = start
  while (current && !seen.has(current.id)) {
    ordered.push(current); seen.add(current.id)
    const nextId: string | undefined = next.get(current.id)
    current = nextId ? byId.get(nextId) : undefined
  }
  return { nodes: ordered.length === workflow.nodes.length ? ordered : workflow.nodes, valid: ordered.length === workflow.nodes.length }
}

function referenceErrors(nodes: Node[]): Map<string, string[]> {
  const positions = new Map(nodes.map((node, index) => [node.id, index])); const errors = new Map<string, string[]>()
  nodes.forEach((node, index) => {
    const found: string[] = []
    if (!isValidate(node)) {
      for (const match of node.prompt.matchAll(/\{\{(.*?)\}\}/g)) {
        const token = match[1].trim(); const ref = token.match(/^(.+)_(output|claims)$/)
        const refPosition = ref ? positions.get(ref[1]) : undefined
        if (token !== 'objective' && (!ref || refPosition === undefined || refPosition >= index)) found.push(token)
      }
    } else {
      const targetPosition = positions.get(node.target)
      if (targetPosition === undefined || targetPosition >= index) found.push(`target ${node.target}`)
    }
    if (found.length) errors.set(node.id, found)
  })
  return errors
}

export default function WorkflowsPage() {
  const [items, setItems] = useState<Workflow[]>([]); const [selected, setSelected] = useState<Workflow | null>(null)
  const [yaml, setYaml] = useState(''); const [validation, setValidation] = useState<Validation | null>(null); const [error, setError] = useState(''); const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const chain = useMemo(() => selected ? chainOrder(selected) : { nodes: [], valid: false }, [selected]); const refErrors = useMemo(() => referenceErrors(chain.nodes), [chain.nodes])
  const load = () => { void api<Workflow[]>('/api/workflows').then(rows => { setItems(rows); setSelected(current => current ?? rows[0] ?? null) }).catch(e => setError(e instanceof ApiError ? e.message : 'Không thể tải workflow')) }
  useEffect(load, [])
  useEffect(() => { if (!selected) return; setYaml(''); setSelectedNode(null); setValidation(null); void api<Source>(`/api/workflows/${encodeURIComponent(selected.id)}/source`).then(source => setYaml(source.yaml_text)).catch(e => setError(e instanceof ApiError ? e.message : 'Không thể đọc YAML workflow')); void api<Validation>('/api/workflows/validate', { method: 'POST', body: JSON.stringify({ id: selected.id }) }).then(setValidation).catch(e => setError(e instanceof ApiError ? e.message : 'Không thể kiểm tra workflow')) }, [selected])
  const validate = async () => { if (!selected) return; setError(''); try { setValidation(await api<Validation>('/api/workflows/validate', { method: 'POST', body: JSON.stringify({ id: selected.id }) })) } catch (e) { setError(e instanceof ApiError ? e.message : 'Validate thất bại') } }
  const active = chain.nodes.find(node => node.id === selectedNode)
  return <div className="flex h-full min-h-0 flex-col gap-4 p-7"><div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-faint">ĐIỀU PHỐI</div><h1 className="text-xl font-semibold">Workflows</h1></div>{error && <div className="text-xs text-err">{error}</div>}<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row"><aside className="w-full shrink-0 overflow-auto rounded-lg border border-line bg-panel p-2 lg:w-64"><div className="mb-2 px-2 text-[10px] uppercase tracking-wider text-faint">Workflow · {items.length}</div>{items.map(row => <button key={row.id} onClick={() => setSelected(row)} className={`mb-1 w-full rounded border px-3 py-2 text-left ${selected?.id === row.id ? 'border-codex bg-panel2' : 'border-transparent hover:bg-panel2'}`}><div className="font-mono text-xs">{row.id}</div><div className="mt-1 flex gap-2 text-[10px] text-dim"><span>{row.nodes.length} node</span>{row.nodes.some(node => !isValidate(node) && node.gate === 'approval') && <span className="rounded-full border border-gate px-1.5 text-gate">approval</span>}</div></button>)}</aside>{selected && <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-lg border border-line bg-panel p-4"><div className="flex flex-wrap items-center gap-2"><h2 className="font-mono text-sm">{selected.id}</h2><button onClick={() => { window.location.hash = `/runs?wf=${encodeURIComponent(selected.id)}` }} className="ml-auto rounded bg-codex px-3 py-1.5 text-xs font-semibold text-ink">Chạy</button><button onClick={() => void validate()} className="rounded border border-line px-3 py-1.5 text-xs">Kiểm tra</button><button disabled className="rounded border border-line px-3 py-1.5 text-xs disabled:opacity-40">Lưu</button></div><div className="grid min-h-0 flex-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]"><section className="min-h-0 overflow-y-auto rounded-lg border border-line bg-ink p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-semibold">Canvas · chuỗi tuyến tính</h3>{!chain.valid && <span className="text-[10px] text-err">Chuỗi không hợp lệ</span>}</div>{chain.nodes.map((node, index) => <div key={node.id}><button onClick={() => setSelectedNode(node.id)} className={`relative w-full rounded-[10px] border bg-panel p-3 text-left ${selectedNode === node.id ? 'border-codex ring-1 ring-codex' : isValidate(node) ? 'border-claude' : 'border-line'} ${refErrors.has(node.id) ? 'border-err' : ''}`}><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-faint">{String.fromCharCode(9312 + index)}</span><span className="font-mono text-xs">{node.id}</span>{isValidate(node) ? <span className="rounded-full border border-claude px-1.5 text-[10px] text-claude">validate</span> : <span className="text-xs text-dim">{node.agent}</span>}</div>{isValidate(node) ? <div className="mt-2 text-[10px] text-dim">target <span className="font-mono text-text">{node.target}</span> · {node.checks.length} checks · on_fail {node.on_fail}</div> : node.gate === 'approval' && <span className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 rotate-45 place-items-center rounded-[3px] border-2 border-gate bg-ink text-gate"><span className="-rotate-45 text-[10px]">duyệt</span></span>}</button>{index < chain.nodes.length - 1 && <div className="flex h-10 flex-col items-center text-codex"><span className="h-6 w-px bg-codex" /><span className="-mt-1 text-sm">▼</span></div>}</div>)}</section><Inspector node={active} errors={active ? refErrors.get(active.id) ?? [] : []} yaml={yaml} /></div>{validation && <div className={`rounded border p-3 text-xs ${validation.ok ? 'border-ok text-ok' : 'border-err text-err'}`}>{validation.ok ? 'Workflow hợp lệ.' : validation.errors.join('; ')}</div>}</main>}</div></div>
}

function Inspector({ node, errors, yaml }: { node?: Node; errors: string[]; yaml: string }) {
  return <aside className="min-h-0 overflow-y-auto rounded-lg border border-line bg-panel2 p-4">{!node ? <div className="text-xs text-faint">Chọn một node để xem</div> : <><div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-faint">Inspector · chỉ đọc</div><Key label="id" value={node.id} /><Key label="type" value={node.type ?? 'agent'} />{isValidate(node) ? <><Key label="target" value={node.target} /><Key label="on_fail" value={node.on_fail} /><div className="mt-3 text-[10px] text-faint">checks</div>{node.checks.map((check, index) => <pre key={index} className="mt-1 whitespace-pre-wrap break-words rounded border border-line bg-ink p-2 font-mono text-[10px] text-dim">{JSON.stringify(check, null, 2)}</pre>)}</> : <><Key label="agent" value={node.agent} /><Key label="gate" value={node.gate ?? 'none'} /><div className="mt-3 text-[10px] text-faint">prompt</div><pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded border border-line bg-ink p-2 font-mono text-[10px] text-text">{node.prompt}</pre></>}{errors.length > 0 && <div className="mt-3 rounded border border-err p-2 text-[10px] text-err">Tham chiếu không hợp lệ: {errors.join(', ')}</div>}</>}{yaml && <label className="mt-5 block text-xs font-semibold">YAML workflow<textarea readOnly value={yaml} rows={8} className="mt-2 w-full resize-y rounded border border-line bg-ink p-3 font-mono text-[10px] text-dim" /></label>}</aside>
}

function Key({ label, value }: { label: string; value: string }) { return <div className="mb-2 flex gap-3 text-xs"><span className="w-16 shrink-0 font-mono text-faint">{label}</span><span className="break-words text-text">{value}</span></div> }
