import { useState } from 'react'
import { Alert, Button, Input, Panel, Toolbar } from '../lib/ui'
import { vgov, type Lineage } from '../lib/vgovApi'

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
      setError(String(e))
    }
  }

  const nodes = lineage ? [
    ['Output revision', `#${lineage.revision.revision_no} · ${lineage.revision.origin}`],
    ...lineage.parent_chain.map(row => ['Parent revision', `#${row.revision_no} · ${row.origin}`]),
    ['Run', lineage.run?.id ?? 'No generating run'],
    ['RD input', lineage.input_revision ? `${lineage.input_revision.content_hash}` : 'Unavailable'],
  ] : []

  return (
    <div className="mx-auto max-w-[900px] space-y-space-4 overflow-auto p-space-6">
      <div>
        <div className="text-section font-semibold uppercase tracking-section text-muted">Output provenance</div>
        <h1 className="text-title font-semibold text-primary">Why this output exists</h1>
        <p className="mt-space-1 text-caption text-secondary">
          Follow upstream chain from revision to input. Release and manifest remain collapsed technical details.
        </p>
      </div>
      <Toolbar className="h-auto min-h-8 gap-space-2">
        <Input value={revisionId} onChange={e => setRevisionId(e.target.value)} placeholder="Output revision UUID" aria-label="Revision UUID" />
        <Button onClick={() => void load()} disabled={!revisionId}>Trace</Button>
      </Toolbar>
      {nodes.length > 0 && (
        <ol className="space-y-space-2">
          {nodes.map(([label, value], index) => (
            <li key={`${label}-${index}`}><Panel>
              <div className="text-caption text-muted">{label}</div>
              <div className="mt-space-1 break-all font-mono text-label text-primary">{value}</div>
            </Panel></li>
          ))}
        </ol>
      )}
      {lineage && (
        <>
          <Button size="sm" onClick={() => setShowTechnical(value => !value)}>
            {showTechnical ? 'Hide technical details' : 'Show release & manifest'}
          </Button>
          {showTechnical && (
            <Panel bodyClassName="text-caption text-secondary">
              <div>Workflow: {lineage.workflow_release?.workflow_id} v{lineage.workflow_release?.release_version}</div>
              <div className="mt-space-2 break-all">Manifest: {lineage.manifest?.manifest_hash}</div>
              <div className="mt-space-2 break-all">Git: {lineage.manifest?.git_commit}</div>
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
