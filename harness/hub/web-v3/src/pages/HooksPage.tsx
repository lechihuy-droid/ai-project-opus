import { useEffect, useState } from 'react'
import { ApiError, api } from '../lib/api'
import { t } from '../lib/i18n'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, Dialog, EmptyState, Input, Panel, Select, Toolbar } from '../lib/ui'

type Hook = { id: string; name: string; event: string; trigger_point: string; agent_id: string; enabled: boolean; executed_count: number; last_run_at: string | null; last_status: string | null; action: { type: string; url?: string; path?: string } }
type HookLog = { hook_id?: string; event?: string; run_id?: string; ts?: string; status?: string; message?: string }

export default function HooksPage() {
  const [rows, setRows] = useState<Hook[]>([])
  const [events, setEvents] = useState<string[]>([])
  const [agents, setAgents] = useState<{ id: string }[]>([])
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [event, setEvent] = useState('')
  const [agentId, setAgentId] = useState('')
  const [target, setTarget] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<Hook | null>(null)
  const [logRows, setLogRows] = useState<HookLog[] | null>(null)

  // A hook only fires for events carrying its agent_id, so the picker is required, not a convenience.
  const load = () => void Promise.all([api<Hook[]>('/api/hooks'), api<string[]>('/api/hooks/events'), api<{ id: string }[]>('/api/agents')]).then(([h, e, a]) => { setRows(h); setEvents(e); setAgents(a); setEvent(x => x || e[0] || ''); setAgentId(x => x || a[0]?.id || '') }).catch(e => setError(e instanceof ApiError ? e.message : t('misc.hooks.loadFailed')))
  useEffect(load, [])

  const resetForm = () => { setName(''); setTarget(''); setEditingId(null) }
  const create = async () => {
    try {
      const created = await api<Hook>('/api/hooks', { method: 'POST', body: JSON.stringify({ name, event, agent_id: agentId, trigger_point: 'runtime', enabled: true, action: { type: 'webhook', url: target } }) })
      setRows(current => [...current, created]); resetForm()
    } catch (e) { setError(e instanceof ApiError ? e.message : t('misc.hooks.createFailed')) }
  }
  const edit = (row: Hook) => { setEditingId(row.id); setName(row.name); setEvent(row.event); setAgentId(row.agent_id); setTarget(row.action.url ?? row.action.path ?? '') }
  const update = async () => {
    if (!editingId) return
    try {
      const updated = await api<Hook>(`/api/hooks/${editingId}`, { method: 'PUT', body: JSON.stringify({ name, event, agent_id: agentId, trigger_point: 'runtime', enabled: true, action: { type: 'webhook', url: target } }) })
      setRows(current => current.map(row => row.id === updated.id ? updated : row)); resetForm()
    } catch (e) { setError(e instanceof ApiError ? e.message : t('misc.hooks.updateFailed')) }
  }
  const remove = async (hookId: string) => {
    try { await api(`/api/hooks/${hookId}`, { method: 'DELETE' }); setRows(current => current.filter(row => row.id !== hookId)); setPendingDelete(null) }
    catch (e) { setError(e instanceof ApiError ? e.message : t('misc.hooks.deleteFailed')) }
  }
  const viewLog = async (row: Hook) => {
    setSelectedLog(row); setLogRows(null)
    try { setLogRows(await api<HookLog[]>(`/api/hooks/${row.id}/log`)) }
    catch (e) { setError(e instanceof ApiError ? e.message : t('misc.hooks.logFailed')); setLogRows([]) }
  }
  const closeLog = () => { setSelectedLog(null); setLogRows(null) }
  const headers = [t('misc.hooks.name'), t('misc.hooks.event'), t('misc.hooks.agent'), t('misc.hooks.triggerPoint'), t('misc.hooks.executed'), t('misc.hooks.status'), t('misc.hooks.lastUpdated'), t('misc.hooks.actions')]

  return <div className="flex h-full min-h-0 flex-col gap-space-4 p-space-6">
    <div><h1 className="text-title font-semibold text-primary">{t('nav.hooks')}</h1><p className="mt-space-1 text-caption text-secondary">{t('misc.hooks.subtitle')}</p></div>
    {error ? <Alert variant="error">{error}</Alert> : null}
    <Toolbar className="h-auto min-h-toolbar flex-wrap">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('misc.hooks.namePlaceholder')} />
      <Select value={event} onChange={e => setEvent(e.target.value)} aria-label={t('misc.hooks.eventLabel')}>{events.map(x => <option key={x}>{x}</option>)}</Select>
      <Select value={agentId} onChange={e => setAgentId(e.target.value)} aria-label={t('misc.hooks.agent')}>{agents.map(x => <option key={x.id}>{x.id}</option>)}</Select>
      <Input value={target} onChange={e => setTarget(e.target.value)} placeholder={t('misc.hooks.targetPlaceholder')} />
      <Button variant="primary" disabled={!name || !event || !agentId || !target} onClick={() => void (editingId ? update() : create())}>{editingId ? t('misc.hooks.save') : t('misc.hooks.new')}</Button>
      {editingId ? <Button variant="ghost" onClick={resetForm}>{t('common.cancel')}</Button> : null}
    </Toolbar>
    <Panel className="min-h-0 flex-1" bodyClassName="h-full min-h-0 overflow-auto p-0">
      {rows.length ? <Table headers={headers} wrapperClassName="rounded-none border-0">{rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.event}</TableCell><TableCell className="font-mono">{row.agent_id || t('common.notAvailable')}</TableCell><TableCell>{row.trigger_point}</TableCell><TableCell>{row.executed_count}</TableCell><TableCell>{row.last_status || t('common.notAvailable')}</TableCell><TableCell>{row.last_run_at || t('common.notAvailable')}</TableCell><TableCell><div className="flex flex-wrap gap-space-1">{pendingDelete === row.id ? <><span className="text-caption text-secondary">{t('misc.hooks.deleteConfirm', { name: row.name })}</span><Button variant="destructive" size="sm" onClick={() => void remove(row.id)}>{t('common.delete')}</Button><Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>{t('common.cancel')}</Button></> : <><Button variant="ghost" size="sm" onClick={() => edit(row)}>{t('misc.hooks.edit')}</Button><Button variant="ghost" size="sm" onClick={() => void viewLog(row)}>{t('misc.hooks.viewLog')}</Button><Button variant="destructive" size="sm" onClick={() => setPendingDelete(row.id)}>{t('common.delete')}</Button></>}</div></TableCell></TableRow>)}</Table> : <div className="p-space-6"><EmptyState title={t('misc.hooks.emptyTitle')} description={t('misc.hooks.emptyDescription')} /></div>}
    </Panel>
    <Dialog open={selectedLog !== null} onOpenChange={open => { if (!open) closeLog() }} title={t('misc.hooks.logTitle', { name: selectedLog?.name ?? '' })} className="!w-[min(720px,calc(100vw-32px))] !max-w-[min(720px,calc(100vw-32px))]" footer={<Button variant="ghost" onClick={closeLog}>{t('common.close')}</Button>}>
      {logRows === null ? <p>{t('misc.hooks.loadingLog')}</p> : logRows.length ? <div className="space-y-space-2">{logRows.map((entry, index) => <pre key={`${entry.ts ?? 'log'}-${index}`} className="overflow-auto rounded-md border border-border-subtle bg-surface p-space-2 text-caption text-secondary">{JSON.stringify(entry, null, 2)}</pre>)}</div> : <p>{t('misc.hooks.emptyLog')}</p>}
    </Dialog>
  </div>
}
