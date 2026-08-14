import { useEffect, useState } from 'react'
import { Alert, Button, Input, Panel, ProviderRail, RunStatusBadge, Select, Status, type RunStatusKind } from '../lib/ui'
import { vgov, type InputRevision, type Release, type Run } from '../lib/vgovApi'
import { ApiError } from '../lib/api'
import { t } from '../lib/i18n'

const terminal = new Set(['SUCCEEDED', 'FAILED', 'FAILED_PRECONDITION', 'CANCELLED'])
const runStatusKind = (status: string): RunStatusKind => {
  if (status === 'SUCCEEDED') return 'success'
  if (status === 'FAILED' || status === 'FAILED_PRECONDITION') return 'error'
  if (status === 'CANCELLED') return 'interrupted'
  if (status === 'QUEUED') return 'queued'
  return 'running'
}

export default function VgovRunPage() {
  const [project, setProject] = useState('demo-api')
  const [workflow, setWorkflow] = useState('rd-to-bd-api')
  const [inputs, setInputs] = useState<InputRevision[]>([])
  const [input, setInput] = useState('')
  const [environment, setEnvironment] = useState('PROD')
  const [environmentRelease, setEnvironmentRelease] = useState<Release | null>(null)
  const [businessKey, setBusinessKey] = useState('F001')
  const [run, setRun] = useState<Run | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void vgov.inputs(project).then(rows => {
      setInputs(rows)
      setInput(current => current || rows[0]?.id || '')
    }).catch(e => setError(e instanceof ApiError ? e.message : t('vgov.loadInputsFailed')))
  }, [project])

  useEffect(() => {
    void vgov.environments(workflow).then(rows => {
      setEnvironmentRelease(rows[environment] ?? null)
    }).catch(e => {
      setEnvironmentRelease(null)
      setError(e instanceof ApiError ? e.message : t('vgov.loadEnvironmentFailed'))
    })
  }, [environment, workflow])

  useEffect(() => {
    if (!run || terminal.has(run.status)) return
    const timer = window.setTimeout(() => void vgov.run(run.id).then(setRun).catch(e => setError(e instanceof ApiError ? e.message : t('vgov.loadRunFailed'))), 1000)
    return () => window.clearTimeout(timer)
  }, [run])

  const start = async () => {
    try {
      setError('')
      setRun(await vgov.runs({ project_key: project, workflow_id: workflow, input_revision_id: input, environment, output_business_key: businessKey }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('vgov.startRunFailed'))
    }
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-space-4 overflow-auto p-space-6">
      <div>
        <div className="text-section font-semibold uppercase tracking-section text-muted">{t('vgov.runEyebrow')}</div>
        <h1 className="text-title font-semibold text-primary">{t('vgov.runWorkflowTitle')}</h1>
        <p className="mt-space-1 text-caption text-secondary">{t('vgov.runSubtitle')}</p>
      </div>
      {!error && <Panel>
        <div className="text-caption text-muted">{t('vgov.releaseLive', { env: environment })}</div>
        {environmentRelease ? (
          <>
            <div className="mt-space-1 text-label font-semibold text-primary">v{environmentRelease.release_version} · <Status kind="ready" label={environmentRelease.status} /></div>
            <div className="mt-space-1 font-mono text-caption text-secondary">
              {environmentRelease.git_commit?.slice(0, 12) ?? t('vgov.commitNotPinned')}
            </div>
          </>
        ) : (
          <p className="mt-space-1 text-caption text-secondary">{t('vgov.noReleaseForEnv', { env: environment })}</p>
        )}
        <a className="mt-space-3 inline-block text-caption text-accent hover:underline" href="#/vgov/releases">
          {t('vgov.manageReleases')}
        </a>
      </Panel>}
      <Panel bodyClassName="grid gap-space-3">
        <label className="text-label text-secondary">{t('vgov.projectFieldLabel')}<Input value={project} onChange={e => setProject(e.target.value)} /></label>
        <label className="text-label text-secondary">{t('vgov.workflowFieldLabel')}<Input value={workflow} onChange={e => setWorkflow(e.target.value)} /></label>
        <label className="text-label text-secondary">{t('vgov.rdInputFieldLabel')}<Select value={input} onChange={e => setInput(e.target.value)}>{inputs.map(row => <option key={row.id} value={row.id}>{t('vgov.inputOption', { key: row.business_key, no: row.revision_no })}</option>)}</Select></label>
        <label className="text-label text-secondary">{t('vgov.environmentFieldLabel')}<Select value={environment} onChange={e => setEnvironment(e.target.value)}><option>DEV</option><option>PROD</option></Select></label>
        <label className="text-label text-secondary">{t('vgov.outputBusinessKeyLabel')}<Input value={businessKey} onChange={e => setBusinessKey(e.target.value)} placeholder="F001" /></label>
        <Button variant="primary" disabled={!input || !businessKey} onClick={() => void start()}>{t('vgov.runButton')}</Button>
      </Panel>
      {run && (
        <Panel>
          <div className="flex items-stretch gap-space-3">
            <ProviderRail provider={null} className="self-stretch" />
            <div>
              <div className="text-caption text-muted">{t('vgov.runId', { id: run.id })}</div>
              <div className="mt-space-1"><RunStatusBadge kind={runStatusKind(run.status)} label={run.status} /></div>
              {run.error_code && <div className="mt-space-1 text-caption text-error">{run.error_code}</div>}
            </div>
          </div>
        </Panel>
      )}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
