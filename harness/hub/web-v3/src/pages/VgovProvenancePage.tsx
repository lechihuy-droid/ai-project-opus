import { useState } from 'react'
import { Alert, Button, EmptyState, Input, Panel, Toolbar } from '../lib/ui'
import { vgov, type Lineage } from '../lib/vgovApi'
import { ApiError } from '../lib/api'
import { t } from '../lib/i18n'

export default function VgovProvenancePage() {
  const [revisionId, setRevisionId] = useState('')
  const [lineage, setLineage] = useState<Lineage | null>(null)
  const [showTechnical, setShowTechnical] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setError('')
      setLineage(await vgov.lineage(revisionId))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('vgov.loadLineageFailed'))
    }
  }

  const nodes = lineage ? [
    [t('vgov.node.output'), `#${lineage.revision.revision_no} · ${lineage.revision.origin}`],
    ...lineage.parent_chain.map(row => [t('vgov.node.parent'), `#${row.revision_no} · ${row.origin}`]),
    [t('vgov.node.run'), lineage.run?.id ?? t('vgov.node.noRun')],
    [t('vgov.node.rdInput'), lineage.input_revision ? `${lineage.input_revision.content_hash}` : t('vgov.unavailable')],
  ] : []

  return (
    <div className="mx-auto max-w-[900px] space-y-space-4 overflow-auto p-space-6">
      <div>
        <div className="text-section font-semibold uppercase tracking-section text-muted">{t('vgov.provenanceEyebrow')}</div>
        <h1 className="text-title font-semibold text-primary">{t('vgov.provenanceTitle')}</h1>
        <p className="mt-space-1 text-caption text-secondary">{t('vgov.provenanceSubtitle')}</p>
      </div>
      <Toolbar className="h-auto min-h-8 gap-space-2">
        <Input value={revisionId} onChange={e => setRevisionId(e.target.value)} placeholder={t('vgov.outputRevisionPlaceholder')} aria-label={t('vgov.revisionUuidLabel')} />
        <Button onClick={() => void load()} disabled={!revisionId}>{t('vgov.trace')}</Button>
      </Toolbar>
      {nodes.length > 0 ? (
        <ol className="space-y-space-2">
          {nodes.map(([label, value], index) => (
            <li key={`${label}-${index}`}><Panel>
              <div className="text-caption text-muted">{label}</div>
              <div className="mt-space-1 break-all font-mono text-label text-primary">{value}</div>
            </Panel></li>
          ))}
        </ol>
      ) : !error && <EmptyState title={t('vgov.emptyProvenanceTitle')} description={t('vgov.emptyProvenanceDesc')} />}
      {lineage && (
        <>
          <Button size="sm" onClick={() => setShowTechnical(value => !value)}>
            {showTechnical ? t('vgov.hideTechnical') : t('vgov.showTechnical')}
          </Button>
          {showTechnical && (
            <Panel bodyClassName="text-caption text-secondary">
              <div>{t('vgov.workflowPrefix')}: {lineage.workflow_release?.workflow_id} v{lineage.workflow_release?.release_version}</div>
              <div className="mt-space-2 break-all">{t('vgov.manifestPrefix')}: {lineage.manifest?.manifest_hash}</div>
              <div className="mt-space-2 break-all">{t('vgov.gitPrefix')}: {lineage.manifest?.git_commit}</div>
              <ul className="mt-space-3 space-y-space-1">
                {lineage.components.map(item => (
                  <li key={`${item.kind}-${item.ref}`}>{item.kind}: {item.ref} @ {item.exact_version}</li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
