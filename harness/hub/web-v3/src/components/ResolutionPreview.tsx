import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { t } from '../lib/i18n'
import { Button, Chip, IconButton, Status } from '../lib/ui'

export type SkillResolutionPreview = {
  mode: string
  agent_id: string
  task: { intent: string[]; domains: string[]; lifecycle_stage: string; tags: string[] }
  selected_skills: Array<{ id: string; name: string; source: string; content_hash: string; capability_state: string }>
  selection_trace: Array<{ skill_id: string; outcome: string; reason: string; capability_state: string }>
  capability_resolution: Array<{ skill_id: string; state: string; capabilities: Array<{ capability_id: string; required: boolean; decision: string }> }>
  policy: { version: string; content_hash: string }
  catalog: { version: string; content_hash: string }
  prompt_budget: { max_skills: number; max_chars: number; used_chars: number; truncated: boolean }
}

type Props = {
  preview: SkillResolutionPreview | null
  loading: boolean
  error: string
  onClose: () => void
}

const shortHash = (hash: string) => hash.replace(/^sha256:/, '').slice(0, 12)
const rejected = (preview: SkillResolutionPreview) => preview.selection_trace.filter(item => item.outcome === 'rejected')
const stateKind = (state: string) => state === 'ready' ? 'ready' : state === 'degraded' ? 'setup-required' : 'error'

export default function ResolutionPreview({ preview, loading, error, onClose }: Props) {
  const panel = useRef<HTMLElement>(null)
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; panel.current?.focus(); return () => previous?.focus() }, [])

  return <section id="skill-resolution-preview" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="skill-resolution-preview-title" onKeyDown={event => { if (event.key === 'Escape') onClose() }} className="absolute inset-0 z-10 overflow-y-auto border-t border-border-strong bg-elevated p-4 outline-none">
    <header className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{t('workflows.resolutionEyebrow')}</div>
        <h2 id="skill-resolution-preview-title" className="mt-1 text-label font-semibold text-primary">{t('workflows.resolutionTitle')}</h2>
      </div>
      <IconButton icon={<X size={16} strokeWidth={1.75} aria-hidden="true" />} aria-label={t('workflows.closeResolutionPreview')} title={t('workflows.closeResolutionPreview')} onClick={onClose} />
    </header>

    {loading && <div role="status" className="py-6 text-caption text-secondary">{t('workflows.resolutionLoading')}</div>}
    {!loading && error && <div role="status" className="mt-4 rounded-md border border-error bg-error-subtle p-3 text-caption text-error">{error}</div>}
    {!loading && !error && preview && <div className="space-y-4 pt-4 text-caption">
      <div role="status" className="rounded-md border border-warning bg-warning-subtle p-3 text-warning">{t('workflows.resolutionShadowWarning')}</div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip>{t('workflows.resolutionMode', { mode: preview.mode })}</Chip>
        <Chip>{t('workflows.resolutionAgent', { agent: preview.agent_id })}</Chip>
        <Chip muted>{t('workflows.resolutionStage', { stage: preview.task.lifecycle_stage })}</Chip>
      </div>

      <section aria-labelledby="resolution-task-title"><h3 id="resolution-task-title" className="text-[10px] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{t('workflows.resolutionTask')}</h3><div className="mt-2 flex flex-wrap gap-2">{preview.task.intent.length ? preview.task.intent.map(item => <Chip key={`intent-${item}`}>{item}</Chip>) : <span className="text-muted">{t('workflows.resolutionNone')}</span>}{preview.task.domains.map(item => <Chip key={`domain-${item}`} muted>{item}</Chip>)}</div></section>

      <section aria-labelledby="resolution-selected-title"><h3 id="resolution-selected-title" className="text-[10px] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{t('workflows.resolutionSelectedSkills', { count: preview.selected_skills.length })}</h3>{preview.selected_skills.length ? <div className="mt-2 space-y-2">{preview.selected_skills.map(skill => <div key={skill.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle bg-surface p-2"><span className="font-mono text-[11px] text-primary">{skill.name}</span><Chip muted>{skill.source}</Chip><span className="font-mono text-[10px] text-muted">{shortHash(skill.content_hash)}</span><Status kind={stateKind(skill.capability_state)} label={skill.capability_state} /></div>)}</div> : <div className="mt-2 text-secondary">{t('workflows.resolutionNoSelectedSkills')}</div>}</section>

      <section aria-labelledby="resolution-budget-title"><h3 id="resolution-budget-title" className="text-[10px] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{t('workflows.resolutionPromptBudget')}</h3><div className="mt-2 rounded-md border border-border-subtle bg-surface p-2 font-mono text-[11px] text-secondary">{t('workflows.resolutionBudgetValue', { used: preview.prompt_budget.used_chars, max: preview.prompt_budget.max_chars, skills: preview.selected_skills.length, skillLimit: preview.prompt_budget.max_skills })}</div></section>

      <section aria-labelledby="resolution-capabilities-title"><h3 id="resolution-capabilities-title" className="text-[10px] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{t('workflows.resolutionCapabilities')}</h3>{preview.capability_resolution.length ? <div className="mt-2 space-y-2">{preview.capability_resolution.map(item => <div key={item.skill_id} className="rounded-md border border-border-subtle bg-surface p-2"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[11px] text-primary">{item.skill_id}</span><Status kind={stateKind(item.state)} label={item.state} /></div>{item.capabilities.length ? <div className="mt-2 flex flex-wrap gap-2">{item.capabilities.map(capability => <Chip key={capability.capability_id} muted>{capability.capability_id} · {capability.required ? t('workflows.resolutionRequired') : t('workflows.resolutionOptional')} · {capability.decision}</Chip>)}</div> : <div className="mt-2 text-muted">{t('workflows.resolutionNoCapabilities')}</div>}</div>)}</div> : <div className="mt-2 text-muted">{t('workflows.resolutionNoCapabilities')}</div>}</section>

      <section aria-labelledby="resolution-rejected-title"><h3 id="resolution-rejected-title" className="text-[10px] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{t('workflows.resolutionRejected')}</h3>{rejected(preview).length ? <ul className="mt-2 space-y-1">{rejected(preview).map(item => <li key={item.skill_id} className="rounded-md border border-border-subtle bg-surface p-2"><span className="font-mono text-[11px] text-primary">{item.skill_id}</span><span className="text-secondary"> · {item.reason}</span></li>)}</ul> : <div className="mt-2 text-muted">{t('workflows.resolutionNoRejectedSkills')}</div>}</section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-[10px] text-muted"><span>{t('workflows.resolutionPolicyVersion', { version: preview.policy.version })}</span><span>{t('workflows.resolutionCatalogVersion', { version: preview.catalog.version })}</span><Button variant="ghost" size="sm" onClick={onClose}>{t('common.close')}</Button></footer>
    </div>}
  </section>
}
