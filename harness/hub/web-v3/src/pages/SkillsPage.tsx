import { Plus, Puzzle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SkillInspector, { type TargetStatusItem } from '../components/SkillInspector'
import { ApiError, api } from '../lib/api'
import { t } from '../lib/i18n'
import { TableCell, TableHeaderCell, TableRow, tableHeaderClass } from '../lib/Table'
import { Alert, Button, Chip, Input, Pagination, SearchInput, Select, Status, Textarea } from '../lib/ui'

export type SkillSummaryItem = { id: string; name: string; description: string; source: string; variants_count: number }
type Summary = { items: SkillSummaryItem[]; total: number; offset: number; limit: number; revision: number; status: string }
type TelemetryItem = { name: string; last_used: string | null; use_count_30d: number | null }
type Telemetry = { status: 'ready'; items: TelemetryItem[] }
type Agent = { id: string; skills: string[] }
type TargetResponse = { target: string; items: TargetStatusItem[] }
type Consistency = 'all' | 'in_sync' | 'modified' | 'missing' | 'conflict'
type Sort = 'name' | 'used' | 'recent'

const formatDate = (value: string | null | undefined) => value ? new Date(value).toISOString().slice(0, 16).replace('T', ' ') : t('common.notAvailable')
const statusLabel = (status: TargetStatusItem['status']) => t(status === 'in_sync' ? 'skills.inSync' : status === 'modified' ? 'skills.modified' : status === 'missing' ? 'skills.missing' : 'skills.conflict')
const statusKind = (status: TargetStatusItem['status']) => status === 'in_sync' ? 'ready' as const : status === 'conflict' ? 'error' as const : 'setup-required' as const

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillSummaryItem[]>([])
  const [summaryLoaded, setSummaryLoaded] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [targetItems, setTargetItems] = useState<TargetStatusItem[] | null>(null)
  const [targetState, setTargetState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [target, setTarget] = useState('')
  const [targetRefresh, setTargetRefresh] = useState(0)
  const [selected, setSelected] = useState<SkillSummaryItem | null>(null)
  const invokerRef = useRef<HTMLElement | null>(null)
  const [error, setError] = useState('')
  const [optionalError, setOptionalError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const [consistency, setConsistency] = useState<Consistency>('all')
  const [sort, setSort] = useState<Sort>('name')
  const [page, setPage] = useState(0)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newContent, setNewContent] = useState('')

  // Primary paint stays metadata-only. All governance projections follow independently.
  const load = () => {
    setError('')
    void api<Summary>('/api/skill-library/summary?limit=500').then(({ items }) => {
      setSkills(items); setSummaryLoaded(true)
      setTarget(current => current || items[0]?.source || '')
      setNewSource(current => current || items[0]?.source || '')
    }).catch(cause => setError(cause instanceof ApiError ? cause.message : t('skills.loadFailed')))
  }
  useEffect(load, [])
  useEffect(() => {
    if (!summaryLoaded || telemetry) return
    let active = true
    void api<Telemetry>('/api/skill-library/telemetry').then(data => { if (active) setTelemetry(data) }).catch(() => { if (active) setOptionalError(t('skills.telemetryUnavailable')) })
    return () => { active = false }
  }, [summaryLoaded, telemetry])
  useEffect(() => {
    let active = true
    void api<Agent[]>('/api/agents').then(data => { if (active) setAgents(data) }).catch(() => { if (active) setOptionalError(t('skills.governanceUnavailable')) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!target) { setTargetItems(null); setTargetState('idle'); return }
    let active = true
    setTargetState('loading'); setTargetItems(null)
    void api<TargetResponse>(`/api/skill-library/target-status?target=${encodeURIComponent(target)}`).then(data => {
      if (!active) return
      if (data.target !== target) throw new Error('target status identity mismatch')
      setTargetItems(data.items); setTargetState('ready')
    }).catch(() => { if (active) { setTargetItems(null); setTargetState('error') } })
    return () => { active = false }
  }, [target, targetRefresh])

  const sources = useMemo(() => [...new Set(skills.map(skill => skill.source))].sort(), [skills])
  const telemetryByName = useMemo(() => new Map((telemetry?.items ?? []).map(item => [item.name, item])), [telemetry])
  const targetBySkillId = useMemo(() => new Map((targetItems ?? []).map(item => [item.skill_id, item])), [targetItems])
  const visible = useMemo(() => skills
    .filter(skill => `${skill.name} ${skill.description} ${skill.source}`.toLowerCase().includes(query.toLowerCase()))
    .filter(skill => source === 'all' || skill.source === source)
    .filter(skill => consistency === 'all' || targetState !== 'ready' || targetBySkillId.get(skill.id)?.status === consistency)
    .sort((a, b) => {
      if (sort === 'used' && telemetry?.status === 'ready') return (telemetryByName.get(b.name)?.use_count_30d ?? -1) - (telemetryByName.get(a.name)?.use_count_30d ?? -1)
      if (sort === 'recent' && telemetry?.status === 'ready') return (telemetryByName.get(b.name)?.last_used ?? '').localeCompare(telemetryByName.get(a.name)?.last_used ?? '')
      return a.name.localeCompare(b.name) || a.source.localeCompare(b.source)
    }), [skills, query, source, consistency, sort, telemetry, telemetryByName, targetBySkillId, targetState])
  const pages = Math.ceil(visible.length / 12)
  const shown = visible.slice(page * 12, page * 12 + 12)
  const differences = useMemo(() => targetState === 'ready' ? [...targetBySkillId.values()].filter(item => item.status !== 'in_sync').length : 0, [targetBySkillId, targetState])
  const targetSummary = targetState === 'ready' ? differences ? t('skills.targetDifferences', { count: differences, target }) : t('skills.targetConsistent', { target }) : targetState === 'error' ? t('skills.unavailable') : t('skills.checking')
  useEffect(() => setPage(0), [query, source, consistency, sort])
  useEffect(() => setPage(current => Math.min(current, Math.max(0, pages - 1))), [pages])

  const openInspector = useCallback((skill: SkillSummaryItem, invoker: HTMLElement) => { invokerRef.current = invoker; setSelected(skill) }, [])
  const closeInspector = useCallback(() => setSelected(null), [])
  const refreshTarget = useCallback(() => setTargetRefresh(value => value + 1), [])
  const create = async () => {
    try {
      await api('/api/skill-library', { method: 'POST', body: JSON.stringify({ name: newName, source: newSource, content: newContent }) })
      setCreating(false); setNewName(''); setNewContent(''); setNotice(t('skills.created')); load()
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : t('skills.createFailed')) }
  }
  const usersFor = (skill: SkillSummaryItem) => agents.filter(agent => agent.skills.includes(skill.name) || agent.skills.includes(skill.id))

  return <div className="flex h-full min-h-0 flex-col gap-space-4 p-space-6">
    <header className="flex items-end justify-between gap-space-3"><div><h1 className="text-title font-semibold text-primary">{t('nav.skills')}</h1><p className="mt-space-1 text-caption text-secondary">{t('skills.description')}</p></div><Button variant="primary" onClick={() => setCreating(true)} icon={<Plus size={16} strokeWidth={1.75} />}>{t('skills.new')}</Button></header>
    {error && <Alert variant="error">{error}</Alert>}{optionalError && <Alert variant="info">{optionalError}</Alert>}{notice && <Alert variant="success">{notice}</Alert>}
    {creating && <section className="grid gap-space-2 rounded-lg border border-border-subtle bg-surface p-space-4"><Input value={newName} onChange={event => setNewName(event.target.value)} placeholder={t('skills.namePlaceholder')} aria-label={t('skills.nameAria')} /><Select value={newSource} onChange={event => setNewSource(event.target.value)} aria-label={t('skills.sourceAria')}>{sources.map(value => <option key={value}>{value}</option>)}</Select><Textarea rows={6} value={newContent} onChange={event => setNewContent(event.target.value)} placeholder={t('skills.contentPlaceholder')} aria-label={t('skills.contentAria')} /><div className="flex gap-space-2"><Button variant="primary" onClick={() => void create()} disabled={!newName || !newSource || !newContent}>{t('skills.create')}</Button><Button variant="secondary" onClick={() => setCreating(false)}>{t('common.cancel')}</Button></div></section>}
    <section className="flex shrink-0 flex-wrap items-center gap-space-2"><SearchInput value={query} onChange={event => setQuery(event.target.value)} onClear={() => setQuery('')} className="w-[300px]" placeholder={t('skills.searchPlaceholder')} aria-label={t('skills.searchAria')} /><Select value={source} onChange={event => setSource(event.target.value)} className="w-[150px]" aria-label={t('skills.filterSource')}><option value="all">{t('skills.allSources')}</option>{sources.map(item => <option key={item} value={item}>{item}</option>)}</Select><Select value={consistency} onChange={event => setConsistency(event.target.value as Consistency)} className="w-[150px]" aria-label={t('skills.filterConsistency')}><option value="all">{t('skills.allConsistency')}</option><option value="in_sync">{t('skills.inSync')}</option><option value="modified">{t('skills.modified')}</option><option value="missing">{t('skills.missing')}</option><option value="conflict">{t('skills.conflict')}</option></Select><Select value={sort} onChange={event => setSort(event.target.value as Sort)} className="w-[150px]" aria-label={t('skills.sort')}><option value="name">{t('skills.sortName')}</option>{telemetry?.status === 'ready' && <><option value="recent">{t('skills.sortRecent')}</option><option value="used">{t('skills.sortUsed')}</option></>}</Select><span className="ml-auto text-caption text-secondary">{t('skills.deployTarget')}</span><Select value={target} onChange={event => setTarget(event.target.value)} className="w-[180px]" aria-label={t('skills.deployTarget')}>{sources.map(value => <option key={value}>{value}</option>)}</Select></section>
    <section className="shrink-0 rounded-lg border border-border-subtle bg-surface px-space-3 py-space-2 text-caption text-secondary"><details><summary className="cursor-pointer">{targetSummary}</summary><p className="mt-space-1 text-muted">{t('skills.consistencyDetail')}</p></details></section>
    <section className="min-h-0 flex-1 overflow-auto rounded-lg border border-border-subtle bg-surface"><table className="w-full min-w-[1080px] text-left"><thead className={`${tableHeaderClass} sticky top-0`}><tr>{[t('skills.columnName'), t('skills.columnSource'), t('skills.columnVariants'), t('skills.columnTargetStatus'), t('skills.columnUsedBy'), t('skills.columnLastUsed'), t('skills.columnActions')].map(head => <TableHeaderCell key={head}>{head}</TableHeaderCell>)}</tr></thead><tbody className="divide-y divide-border-subtle">{shown.map(skill => { const comparison = targetBySkillId.get(skill.id); const usage = telemetryByName.get(skill.name); const users = usersFor(skill); return <TableRow key={skill.id} data-selected={selected?.id === skill.id ? 'true' : undefined}><TableCell><button type="button" onClick={event => openInspector(skill, event.currentTarget)} className="flex min-w-0 items-center gap-space-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-elevated text-accent"><Puzzle size={14} strokeWidth={1.75} aria-hidden="true" /></span><span className="min-w-0 truncate"><span className="font-semibold text-primary">{skill.name}</span><span className="ml-space-2 text-caption text-muted">{skill.description || t('common.notAvailable')}</span></span></button></TableCell><TableCell><Chip>{skill.source}</Chip></TableCell><TableCell className="text-secondary">{skill.variants_count}</TableCell><TableCell>{targetState === 'ready' && comparison ? <Status kind={statusKind(comparison.status)} label={statusLabel(comparison.status)} className="whitespace-nowrap" /> : <span className="text-muted">{targetState === 'error' ? t('skills.unavailable') : t('skills.checking')}</span>}</TableCell><TableCell className="text-secondary">{users.length ? `${users[0].id}${users.length > 1 ? ` +${users.length - 1}` : ''}` : t('skills.usedByNone')}</TableCell><TableCell className="whitespace-nowrap font-mono text-secondary">{telemetry?.status === 'ready' ? formatDate(usage?.last_used) : t('skills.checking')}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={event => openInspector(skill, event.currentTarget)}>{t('skills.viewDetails')}</Button></TableCell></TableRow> })}</tbody></table></section>
    <footer className="flex shrink-0 items-center justify-between text-caption text-secondary"><span>{t('skills.showing', { shown: shown.length, total: visible.length })}</span>{pages > 1 && <Pagination page={page + 1} pageCount={pages} onChange={value => setPage(value - 1)} previousLabel={t('skills.previous')} nextLabel={t('skills.next')} />}</footer>
    {selected && <SkillInspector key={selected.id} skill={selected} target={target} comparison={targetBySkillId.get(selected.id)} variants={skills.filter(item => item.name === selected.name)} invokerRef={invokerRef} onClose={closeInspector} onSynced={refreshTarget} />}
  </div>
}
