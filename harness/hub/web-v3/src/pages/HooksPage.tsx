import { useEffect, useState } from 'react'
import { ApiError, api } from '../lib/api'
import { t } from '../lib/i18n'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, EmptyState, Input, Panel, Select, Toolbar } from '../lib/ui'

type Hook = { id: string; name: string; event: string; trigger_point: string; agent_id: string; enabled: boolean; executed_count: number; last_run_at: string | null; last_status: string | null; action: { type: string; url?: string; path?: string } }

export default function HooksPage() {
  const [rows, setRows] = useState<Hook[]>([])
  const [events, setEvents] = useState<string[]>([])
  const [agents, setAgents] = useState<{ id: string }[]>([])
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [event, setEvent] = useState('')
  const [agentId, setAgentId] = useState('')
  const [target, setTarget] = useState('')

  // A hook only fires for events carrying its agent_id, so the picker is required, not a convenience.
  const load = () => void Promise.all([api<Hook[]>('/api/hooks'), api<string[]>('/api/hooks/events'), api<{ id: string }[]>('/api/agents')]).then(([h, e, a]) => { setRows(h); setEvents(e); setAgents(a); setEvent(x => x || e[0] || ''); setAgentId(x => x || a[0]?.id || '') }).catch(e => setError(e instanceof ApiError ? e.message : t('misc.hooks.loadFailed')))
  useEffect(load, [])
  const create = async () => { try { await api('/api/hooks', { method: 'POST', body: JSON.stringify({ name, event, agent_id: agentId, trigger_point: 'runtime', enabled: true, action: { type: 'webhook', url: target } }) }); setName(''); setTarget(''); load() } catch (e) { setError(e instanceof ApiError ? e.message : t('misc.hooks.createFailed')) } }
  const headers = [t('misc.hooks.name'), t('misc.hooks.event'), t('misc.hooks.agent'), t('misc.hooks.triggerPoint'), t('misc.hooks.executed'), t('misc.hooks.status'), t('misc.hooks.lastUpdated')]

  return <div className="flex h-full min-h-0 flex-col gap-space-4 p-space-6">
    <div><h1 className="text-title font-semibold text-primary">Hooks</h1><p className="mt-space-1 text-caption text-secondary">{t('misc.hooks.subtitle')}</p></div>
    {error ? <Alert variant="error">{error}</Alert> : null}
    <Toolbar className="h-auto min-h-toolbar flex-wrap">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('misc.hooks.namePlaceholder')} />
      <Select value={event} onChange={e => setEvent(e.target.value)} aria-label={t('misc.hooks.eventLabel')}>{events.map(x => <option key={x}>{x}</option>)}</Select>
      <Select value={agentId} onChange={e => setAgentId(e.target.value)} aria-label={t('misc.hooks.agent')}>{agents.map(x => <option key={x.id}>{x.id}</option>)}</Select>
      <Input value={target} onChange={e => setTarget(e.target.value)} placeholder="Webhook URL" />
      <Button variant="primary" disabled={!name || !event || !agentId || !target} onClick={() => void create()}>{t('misc.hooks.new')}</Button>
    </Toolbar>
    <Panel className="min-h-0 flex-1" bodyClassName="h-full min-h-0 overflow-auto p-0">
      {rows.length ? <Table headers={headers} wrapperClassName="rounded-none border-0">{rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.event}</TableCell><TableCell className="font-mono">{row.agent_id || '—'}</TableCell><TableCell>{row.trigger_point}</TableCell><TableCell>{row.executed_count}</TableCell><TableCell>{row.last_status || '—'}</TableCell><TableCell>{row.last_run_at || '—'}</TableCell></TableRow>)}</Table> : <div className="p-space-6"><EmptyState title={t('misc.hooks.emptyTitle')} description={t('misc.hooks.emptyDescription')} /></div>}
    </Panel>
  </div>
}
