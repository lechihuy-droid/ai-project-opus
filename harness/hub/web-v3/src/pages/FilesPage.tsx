import { useEffect, useRef, useState } from 'react'
import { ApiError, api } from '../lib/api'
import { t } from '../lib/i18n'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, EmptyState, Panel, Select, Toolbar } from '../lib/ui'

type Run = { run_id: string; status: string }
type Item = { name: string; size: number; updated_at: string | number }

export default function FilesPage() {
  const [runs, setRuns] = useState<Run[]>([])
  const [run, setRun] = useState('')
  const [files, setFiles] = useState<Item[]>([])
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const load = () => void api<Run[]>('/api/agent/runs').then(rows => { setRuns(rows); setRun(current => current || rows[0]?.run_id || '') }).catch(e => setError(e instanceof ApiError ? e.message : t('misc.files.loadRunsFailed')))
  const loadFiles = () => run && void api<Item[]>(`/api/runs/${encodeURIComponent(run)}/files`).then(setFiles).catch(e => setError(e instanceof ApiError ? e.message : t('misc.files.loadFilesFailed')))

  useEffect(load, [])
  useEffect(() => { if (run) void api<Item[]>(`/api/runs/${encodeURIComponent(run)}/files`).then(setFiles).catch(e => setError(e instanceof ApiError ? e.message : t('misc.files.loadFilesFailed'))) }, [run])

  const upload = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    try { await api(`/api/runs/${encodeURIComponent(run)}/files`, { method: 'POST', body: form }); loadFiles() } catch (e) { setError(e instanceof ApiError ? e.message : t('misc.files.uploadFailed')) }
  }

  const headers = [t('misc.files.name'), t('misc.files.size'), t('misc.files.updated'), '']

  return <div className="flex h-full min-h-0 flex-col gap-space-4 p-space-6">
    <Toolbar className="justify-between">
      <div><h1 className="text-title font-semibold text-primary">Files</h1><p className="mt-space-1 text-caption text-secondary">{t('misc.files.subtitle')}</p></div>
      <Button variant="primary" disabled={!run} onClick={() => input.current?.click()}>Upload</Button>
      <input ref={input} className="hidden" type="file" onChange={e => e.target.files?.[0] && void upload(e.target.files[0])} />
    </Toolbar>
    {error ? <Alert variant="error">{error}</Alert> : null}
    <Select value={run} onChange={e => setRun(e.target.value)} className="max-w-[420px]"><option value="">{t('misc.files.chooseRun')}</option>{runs.map(item => <option key={item.run_id} value={item.run_id}>{item.run_id} · {item.status}</option>)}</Select>
    <Panel className="min-h-0 flex-1" bodyClassName="h-full min-h-0 overflow-auto p-0">
      {files.length ? <Table headers={headers} wrapperClassName="rounded-none border-0">{files.map(item => <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{item.size} B</TableCell><TableCell>{String(item.updated_at)}</TableCell><TableCell><a className="text-accent" href={`/api/runs/${encodeURIComponent(run)}/files/${encodeURIComponent(item.name)}`}>{t('misc.files.download')}</a> <Button size="sm" variant="ghost" onClick={() => void api(`/api/runs/${encodeURIComponent(run)}/files/${encodeURIComponent(item.name)}`, { method: 'DELETE' }).then(loadFiles)}>{t('common.delete')}</Button></TableCell></TableRow>)}</Table> : <div className="p-space-6"><EmptyState title={t('misc.files.emptyTitle')} description={run ? t('misc.files.emptyForRun') : t('misc.files.emptyNoRun')} /></div>}
    </Panel>
  </div>
}
