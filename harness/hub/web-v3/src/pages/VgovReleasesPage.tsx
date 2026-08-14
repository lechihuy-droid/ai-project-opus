import { useEffect, useState } from 'react'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, EmptyState, Input, Panel, Status, Toolbar, type StatusKind } from '../lib/ui'
import { vgov, type Release } from '../lib/vgovApi'
import { t } from '../lib/i18n'

export default function VgovReleasesPage() {
  const [workflow, setWorkflow] = useState('rd-to-bd-api')
  const [releases, setReleases] = useState<Release[]>([])
  const [env, setEnv] = useState<Record<string, Release>>({})
  const [message, setMessage] = useState('')

  const load = () => {
    void vgov.releases(workflow).then(setReleases).catch(error => setMessage(String(error)))
    void vgov.environments(workflow).then(setEnv).catch(() => setEnv({}))
  }
  useEffect(load, [workflow])

  const promote = async (target: 'DEV' | 'PROD', release: Release) => {
    try {
      await vgov.setEnvironment(target, workflow, release.id, `${target} promotion from Hub`)
      setMessage(t('vgov.promotedTo', { version: `v${release.release_version}`, env: target }))
      load()
    } catch (error) {
      setMessage(String(error))
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-space-4 overflow-auto p-space-6">
      <div>
        <div className="text-section font-semibold uppercase tracking-section text-muted">{t('vgov.deliveryEyebrow')}</div>
        <h1 className="text-title font-semibold text-primary">{t('vgov.releasePointers')}</h1>
        <p className="mt-space-1 text-caption text-secondary">{t('vgov.releaseSubtitle')}</p>
      </div>
      <Toolbar className="h-auto min-h-8 max-w-md gap-space-2">
        <Input value={workflow} onChange={e => setWorkflow(e.target.value)} aria-label={t('vgov.workflowIdLabel')} />
        <Button onClick={load}>{t('vgov.refresh')}</Button>
      </Toolbar>
      <div className="grid gap-space-3 md:grid-cols-2">
        {(['DEV', 'PROD'] as const).map(name => (
          <Panel key={name}>
            <div className="text-caption text-muted">{t('vgov.pointer', { env: name })}</div>
            <div className="mt-space-1 text-label font-semibold text-primary">
              {env[name] ? `v${env[name].release_version}` : t('vgov.notPromoted')}
            </div>
          </Panel>
        ))}
      </div>
      {message && <Alert variant="info">{message}</Alert>}
      <Panel bodyClassName="p-0">
        {releases.length ? <Table headers={[t('vgov.releaseHeader'), t('vgov.statusHeader'), t('vgov.actionsHeader')]} wrapperClassName="rounded-none border-0">
        {releases.map(release => (
          <ReleaseRow
            key={release.id}
            release={release}
            onPublish={() => void vgov.publish(release.id).then(load)}
            onPromote={target => void promote(target, release)}
          />
        ))}
        </Table> : <div className="p-space-6"><EmptyState title={t('vgov.releasePointers')} description={t('vgov.releaseSubtitle')} /></div>}
      </Panel>
    </div>
  )
}

function releaseStatusKind(status: string): StatusKind {
  if (status === 'PUBLISHED') return 'ready'
  if (status === 'DRAFT') return 'setup-required'
  return 'error'
}

function ReleaseRow({ release, onPublish, onPromote }: { release: Release; onPublish: () => void; onPromote: (target: 'DEV' | 'PROD') => void }) {
  const [pending, setPending] = useState<'PUBLISH' | 'DEV' | 'PROD' | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const version = `v${release.release_version}`
  const reset = () => { setPending(null); setConfirmText('') }
  return (
    <TableRow>
      <TableCell>
        <div className="text-label font-semibold text-primary">{version}</div>
        <div className="text-caption text-muted">{release.workflow_id}</div>
      </TableCell>
      <TableCell><Status kind={releaseStatusKind(release.status)} label={release.status} /></TableCell>
      <TableCell><div className="flex flex-wrap gap-space-2">
        {pending === null && release.status === 'DRAFT' && <Button size="sm" onClick={() => setPending('PUBLISH')}>{t('vgov.publish')}</Button>}
        {pending === null && release.status === 'PUBLISHED' && (<><Button size="sm" onClick={() => setPending('DEV')}>{t('vgov.promoteDev')}</Button><Button size="sm" onClick={() => setPending('PROD')}>{t('vgov.promoteProd')}</Button></>)}
        {pending === 'PUBLISH' && <><span className="text-caption text-secondary">{t('vgov.publishConfirm', { version })}</span><Button variant="ghost" size="sm" onClick={() => { onPublish(); reset() }}>{t('vgov.confirm')}</Button><Button variant="ghost" size="sm" onClick={reset}>{t('common.cancel')}</Button></>}
        {pending === 'DEV' && <><span className="text-caption text-secondary">{t('vgov.promoteConfirm', { env: 'DEV', version })}</span><Button variant="primary" size="sm" onClick={() => { onPromote('DEV'); reset() }}>{t('vgov.confirm')}</Button><Button variant="ghost" size="sm" onClick={reset}>{t('common.cancel')}</Button></>}
        {pending === 'PROD' && <div className="flex flex-col gap-space-1"><span className="text-caption text-error">{t('vgov.prodConfirmWarn', { env: 'PROD', version })}</span><div className="flex flex-wrap items-center gap-space-2"><Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={t('vgov.prodTypePrompt')} aria-label={t('vgov.prodTypePrompt')} className="w-40" /><Button variant="destructive" size="sm" disabled={confirmText !== 'PROD'} onClick={() => { onPromote('PROD'); reset() }}>{t('vgov.confirm')}</Button><Button variant="ghost" size="sm" onClick={reset}>{t('common.cancel')}</Button></div></div>}
      </div></TableCell>
    </TableRow>
  )
}
