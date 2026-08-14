import { X } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { ApiError, api } from '../lib/api'
import { t } from '../lib/i18n'
import { Alert, Button, Chip, IconButton, Status } from '../lib/ui'
import type { SkillSummaryItem } from '../pages/SkillsPage'

type Detail = SkillSummaryItem & { path: string; content_hash: string; content: string; files: string[] }
type TargetDetail = { skillId: string; detail: Detail }
export type TargetStatusItem = { skill_id: string; name: string; source: string; target: string; target_skill_id: string | null; status: 'in_sync' | 'modified' | 'missing' | 'conflict'; source_hash: string; target_hash: string | null; baseline_hash: string | null; source_changed: boolean; target_changed: boolean }
type SkillInspectorProps = { skill: SkillSummaryItem; target: string; comparison?: TargetStatusItem; variants: SkillSummaryItem[]; invokerRef: RefObject<HTMLElement | null>; onClose: () => void; onSynced: () => void }

const resultKind = (status: TargetStatusItem['status']) => status === 'in_sync' ? 'ready' as const : status === 'conflict' ? 'error' as const : 'setup-required' as const
const resultLabel = (status: TargetStatusItem['status']) => t(status === 'in_sync' ? 'skills.inSync' : status === 'modified' ? 'skills.modified' : status === 'missing' ? 'skills.missing' : 'skills.conflict')
const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function SkillInspector({ skill, target, comparison, variants, invokerRef, onClose, onSynced }: SkillInspectorProps) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [targetDetail, setTargetDetail] = useState<TargetDetail | null>(null)
  const [targetDetailErrorId, setTargetDetailErrorId] = useState<string | null>(null)
  const [targetDetailRetry, setTargetDetailRetry] = useState(0)
  const [comparisonExpanded, setComparisonExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)
  const currentTargetRef = useRef<string | null>(null)
  const targetDetailCacheRef = useRef(new Map<string, Detail>())
  const targetRequestRef = useRef(new Map<string, Promise<Detail>>())
  const targetGenerationRef = useRef(new Map<string, number>())
  const targetSkillId = comparison?.target_skill_id ?? null
  const displayedTargetDetail = targetDetail?.skillId === targetSkillId ? targetDetail.detail : null
  const targetDetailError = targetDetailErrorId === targetSkillId

  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    let active = true
    targetDetailCacheRef.current.clear(); targetRequestRef.current.clear(); targetGenerationRef.current.clear(); currentTargetRef.current = null
    setLoading(true); setDetail(null); setTargetDetail(null); setTargetDetailErrorId(null); setComparisonExpanded(false); setError('')
    void api<Detail>(`/api/skill-library/${skill.id}`).then(data => { if (active) setDetail(data) }).catch(() => { if (active) setError(t('skills.loadOneFailed')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [skill.id])
  useEffect(() => {
    currentTargetRef.current = targetSkillId
    setTargetDetail(null); setTargetDetailErrorId(null); setTargetDetailRetry(0)
  }, [targetSkillId])
  useEffect(() => {
    if (!comparisonExpanded || !targetSkillId) return
    const cached = targetDetailCacheRef.current.get(targetSkillId)
    if (cached) { setTargetDetail({ skillId: targetSkillId, detail: cached }); return }
    const generation = targetGenerationRef.current.get(targetSkillId) ?? 0
    if (!targetGenerationRef.current.has(targetSkillId)) targetGenerationRef.current.set(targetSkillId, generation)
    const request = targetRequestRef.current.get(targetSkillId) ?? api<Detail>(`/api/skill-library/${targetSkillId}`)
    if (!targetRequestRef.current.has(targetSkillId)) targetRequestRef.current.set(targetSkillId, request)
    void request.then(data => {
      if (targetGenerationRef.current.get(targetSkillId) !== generation || data.id !== targetSkillId) return
      targetDetailCacheRef.current.set(targetSkillId, data)
      if (currentTargetRef.current !== targetSkillId) return
      setTargetDetail({ skillId: targetSkillId, detail: data })
    }).catch(() => {
      if (targetGenerationRef.current.get(targetSkillId) !== generation || currentTargetRef.current !== targetSkillId) return
      setTargetDetailErrorId(targetSkillId); setError(t('skills.loadTargetFailed'))
    }).finally(() => {
      if (targetRequestRef.current.get(targetSkillId) === request) targetRequestRef.current.delete(targetSkillId)
    })
  }, [comparisonExpanded, targetSkillId, targetDetailRetry])
  useEffect(() => {
    const invoker = invokerRef.current
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      const focusable = panel ? Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(item => !item.hasAttribute('disabled')) : []
      if (!focusable.length) { event.preventDefault(); panel?.focus(); return }
      const current = document.activeElement as HTMLElement | null
      const index = current ? focusable.indexOf(current) : -1
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1]?.focus() }
      else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0]?.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); invoker?.focus() }
  }, [invokerRef])

  const invalidateTargetDetail = () => {
    if (!targetSkillId) return
    targetGenerationRef.current.set(targetSkillId, (targetGenerationRef.current.get(targetSkillId) ?? 0) + 1)
    targetDetailCacheRef.current.delete(targetSkillId)
    targetRequestRef.current.delete(targetSkillId)
    setTargetDetail(null); setTargetDetailErrorId(null); setTargetDetailRetry(value => value + 1)
  }
  const retryTargetDetail = () => { invalidateTargetDetail() }
  const sync = async () => {
    if (!comparison || !target) return
    const allow_conflict = comparison.status === 'conflict' && window.confirm(t('skills.confirmConflict'))
    if (comparison.status === 'conflict' && !allow_conflict) return
    setSyncing(true); setError('')
    try { await api(`/api/skill-library/${encodeURIComponent(skill.id)}/deploy`, { method: 'POST', body: JSON.stringify({ target, expected_target_hash: comparison.target_hash, allow_conflict }) }); invalidateTargetDetail(); onSynced() } catch (cause) { setError(cause instanceof ApiError ? cause.message : t('skills.deployFailed')) } finally { setSyncing(false) }
  }

  return <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('skills.inspectorAria', { name: skill.name })} className="absolute inset-y-0 right-0 z-20 flex w-full max-w-[620px] flex-col border-l border-border-subtle bg-surface shadow-xl">
    <header className="flex items-start justify-between gap-space-2 border-b border-border-subtle p-space-4"><div><h2 className="font-mono text-label text-primary">{skill.name}</h2><p className="mt-space-1 text-caption text-muted">{skill.id}</p></div><IconButton ref={closeButtonRef} icon={<X size={16} strokeWidth={1.75} />} aria-label={t('skills.closeDetails')} title={t('skills.closeDetails')} onClick={onClose} /></header>
    <div className="min-h-0 flex-1 space-y-space-4 overflow-y-auto p-space-4">
      {error && <Alert variant="error">{error}</Alert>}
      {loading ? <p className="text-caption text-muted">{t('skills.loadingDetail')}</p> : detail && <>
        <section className="space-y-space-2"><div className="flex flex-wrap items-center gap-space-2"><Chip>{detail.source}</Chip>{comparison && <Status kind={resultKind(comparison.status)} label={resultLabel(comparison.status)} />}</div><dl className="grid gap-space-2 text-caption"><div><dt className="text-muted">{t('skills.evidenceSourceHash')}</dt><dd className="break-all font-mono text-secondary">{comparison?.source_hash ?? detail.content_hash}</dd></div>{comparison && <div><dt className="text-muted">{t('skills.evidenceTargetHash')}</dt><dd className="break-all font-mono text-secondary">{comparison.target_hash ?? t('common.notAvailable')}</dd></div>}{comparison?.baseline_hash && <div><dt className="text-muted">{t('skills.evidenceBaseline')}</dt><dd className="break-all font-mono text-secondary">{comparison.baseline_hash}</dd></div>}</dl></section>
        <section><h3 className="text-label font-semibold text-primary">{t('skills.variantsLabel')}</h3><div className="mt-space-2 flex flex-wrap gap-space-1">{variants.map(item => <Chip key={item.id} muted={item.id !== skill.id}>{item.source}</Chip>)}</div></section>
        <section><h3 className="text-label font-semibold text-primary">{t('skills.sourceContent')}</h3><pre className="mt-space-2 max-h-[240px] overflow-auto whitespace-pre-wrap rounded-md border border-border-subtle bg-app p-space-3 font-mono text-caption text-secondary">{detail.content}</pre></section>
        {targetSkillId && <section><Button variant="secondary" size="sm" onClick={() => setComparisonExpanded(value => !value)}>{t('skills.compareChanges')}</Button>{comparisonExpanded && <div className="mt-space-3 grid gap-space-3 lg:grid-cols-2"><pre className="max-h-[240px] overflow-auto whitespace-pre-wrap rounded-md border border-border-subtle bg-app p-space-3 font-mono text-caption text-secondary">{detail.content}</pre><div>{targetDetailError ? <Button variant="secondary" size="sm" onClick={retryTargetDetail}>{t('skills.retryTarget')}</Button> : <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap rounded-md border border-border-subtle bg-app p-space-3 font-mono text-caption text-secondary">{displayedTargetDetail?.content ?? t('skills.loadingTarget')}</pre>}</div></div>}</section>}
        <section className="border-t border-border-subtle pt-space-3"><Button variant={comparison?.status === 'conflict' ? 'warning' : 'primary'} loading={syncing} disabled={!comparison || comparison.status === 'in_sync'} onClick={() => void sync()}>{t('skills.syncToTarget')}</Button></section>
      </>}
    </div>
  </aside>
}
