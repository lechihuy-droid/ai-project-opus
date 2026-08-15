import { useEffect, useState } from 'react'
import { Alert, Button, EmptyState, Input, Panel, Select, Textarea, Toolbar } from '../lib/ui'
import { vgov, type Artifact, type Revision } from '../lib/vgovApi'
import { Markdown } from '../lib/markdown'
import { ApiError } from '../lib/api'
import { t } from '../lib/i18n'

export default function VgovOutputPage() {
  const [project, setProject] = useState('demo-api')
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [artifactId, setArtifactId] = useState('')
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [revisionId, setRevisionId] = useState('')
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadArtifacts = () => {
    setError('')
    void vgov.artifacts(project).then(rows => {
      setArtifacts(rows)
      setArtifactId(current => current || rows[0]?.id || '')
    }).catch(e => setError(e instanceof ApiError ? e.message : t('vgov.loadArtifactsFailed')))
  }
  useEffect(loadArtifacts, [project])

  useEffect(() => {
    if (!artifactId) return
    setError('')
    void vgov.revisions(artifactId).then(rows => {
      setRevisions(rows)
      setRevisionId(current => current || rows.at(-1)?.id || '')
    }).catch(e => setError(e instanceof ApiError ? e.message : t('vgov.loadRevisionsFailed')))
  }, [artifactId])

  useEffect(() => {
    if (revisionId) {
      setError('')
      void vgov.content(revisionId).then(setContent).catch(e => setError(e instanceof ApiError ? e.message : t('vgov.loadContentFailed')))
    }
  }, [revisionId])

  const revise = async () => {
    try {
      const next = await vgov.edit(revisionId, content)
      setRevisions(rows => [...rows, next])
      setRevisionId(next.id)
      setEditing(false)
      setMessage(t('vgov.savedRevision', { revision: next.revision_no }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('vgov.saveRevisionFailed'))
    }
  }

  const approve = async () => {
    try {
      await vgov.approve(artifactId, revisionId)
      setMessage(t('vgov.approvedBaselineUpdated'))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('vgov.approveBaselineFailed'))
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-space-4 overflow-auto p-space-6">
      <div>
        <div className="text-section font-semibold uppercase tracking-section text-muted">{t('vgov.outputEyebrow')}</div>
        <h1 className="text-title font-semibold text-primary">{t('vgov.outputHistoryTitle')}</h1>
      </div>
      <Toolbar className="h-auto min-h-toolbar flex-wrap">
        <Input className="max-w-xs" value={project} onChange={e => setProject(e.target.value)} aria-label={t('vgov.projectIdLabel')} />
        <Button onClick={loadArtifacts}>{t('vgov.refresh')}</Button>
        <Select
          className="max-w-xs"
          value={artifactId}
          onChange={e => {
            setArtifactId(e.target.value)
            setRevisionId('')
          }}
        >
          {artifacts.map(a => (
            <option key={a.id} value={a.id}>{a.display_name || a.business_key}</option>
          ))}
        </Select>
        <Select className="max-w-xs" value={revisionId} onChange={e => setRevisionId(e.target.value)}>
          {revisions.map(r => (
            <option key={r.id} value={r.id}>{t('vgov.revisionOption', { no: r.revision_no, origin: r.origin })}</option>
          ))}
        </Select>
      </Toolbar>
      <Toolbar className="h-auto min-h-8 gap-space-2">
        <Button onClick={() => setEditing(value => !value)} disabled={!revisionId}>{editing ? t('vgov.preview') : t('vgov.editContent')}</Button>
        <Button variant="primary" onClick={() => void approve()} disabled={!revisionId}>{t('vgov.approve')}</Button>
      </Toolbar>
      {!error && !artifactId && <EmptyState title={t('vgov.emptyArtifactsTitle')} description={t('vgov.emptyArtifactsDesc')} />}
      {!error && artifactId && !revisionId && <EmptyState title={t('vgov.emptyRevisionsTitle')} description={t('vgov.emptyRevisionsDesc')} />}
      {!error && (editing ? (
        <Panel className="space-y-space-2" bodyClassName="space-y-space-2">
          <Textarea value={content} onChange={e => setContent(e.target.value)} aria-label={t('vgov.revisionMarkdownLabel')} className="min-h-[420px] font-mono" />
          <Button variant="primary" onClick={() => void revise()}>{t('vgov.saveHumanEdit')}</Button>
        </Panel>
      ) : (
        <Panel bodyClassName="p-space-5 text-label text-secondary">
          <Markdown source={content} />
        </Panel>
      ))}
      {error && <Alert variant="error">{error}</Alert>}
      {!error && message && <Alert variant="info">{message}</Alert>}
    </div>
  )
}
