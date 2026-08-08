import { useEffect, useState } from 'react'
import { ApiError, api } from '../lib/api'
import { t } from '../lib/i18n'
import { Alert, Button, Chip, Input, Panel, ProviderDot, Status, Toolbar } from '../lib/ui'
import { asProviderId } from '../lib/uiHelpers'

type Provider = { id: string; available: boolean; version?: string; detail?: string }
type Models = { default?: string; catalog?: Catalog[]; models?: string[] }
type Catalog = { id?: string; shortName?: string; label?: string; category?: string }
type Health = { root?: string; runs_dir?: string; port?: number }
type Retention = { days?: number }

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Models>({})
  const [health, setHealth] = useState<Health>({})
  const [retention, setRetention] = useState<Retention>({})
  const [days, setDays] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { void Promise.all([api<Provider[]>('/api/providers'), api<Models>('/api/chat/models'), api<Health>('/api/health'), api<Retention>('/api/settings/retention')]).then(([p, m, h, r]) => { setProviders(p); setModels(m); setHealth(h); setRetention(r); setDays(r.days === undefined ? '' : String(r.days)) }).catch(e => setError(e instanceof ApiError ? e.message : t('settings.loadFailed'))) }, [])
  const saveRetention = () => { const value = Number(days); if (!Number.isInteger(value)) { setError(t('settings.invalidDays')); return }; void api<Retention>('/api/settings/retention', { method: 'PUT', body: JSON.stringify({ days: value }) }).then(r => { setRetention(r); setDays(r.days === undefined ? '' : String(r.days)); setError('') }).catch(e => setError(e instanceof ApiError ? e.message : t('settings.saveRetentionFailed'))) }
  const catalog: Catalog[] = models.catalog ?? (models.models ?? []).map(id => ({ id }))

  return <div className="flex h-full min-h-0 flex-col gap-space-4 overflow-auto p-space-6">
    <header><div className="mb-space-2 text-section font-semibold uppercase tracking-section text-muted">{t('settings.section')}</div><h1 className="text-title font-semibold">{t('settings.title')}</h1><p className="text-secondary">{t('settings.description')}</p></header>
    {error ? <Alert variant="error">{error}</Alert> : null}
    <section><h2 className="mb-space-2 text-label font-semibold">{t('settings.providerHealth')}</h2><div className="grid gap-space-3 md:grid-cols-2">{providers.map(item => <Panel key={item.id} bodyClassName="p-space-4"><div className="flex items-center gap-space-2"><ProviderDot provider={asProviderId(item.id)} /><span className="font-mono text-body">{item.id}</span><Status kind={item.available ? 'ready' : 'error'} label={item.available ? 'OK' : 'ERR'} className="ml-auto" /></div><dl className="mt-space-3 space-y-space-1 text-caption"><div className="flex justify-between gap-space-3"><dt className="text-muted">{t('settings.version')}</dt><dd className="font-mono text-secondary">{item.version ?? t('common.notAvailable')}</dd></div><div className="flex justify-between gap-space-3"><dt className="text-muted">{t('settings.details')}</dt><dd className="text-right text-secondary">{item.detail || t('common.notAvailable')}</dd></div></dl></Panel>)}</div></section>
    <Panel header={<><h2 className="text-label font-semibold">{t('settings.operationalRetention')}</h2><p className="mt-space-1 text-caption text-secondary">{t('settings.retentionDescription')}</p></>} bodyClassName="p-space-4"><Toolbar className="h-auto min-h-toolbar flex-wrap"><label className="text-caption text-muted">{t('settings.days')}<Input aria-label={t('settings.daysAria')} value={days} onChange={e => setDays(e.target.value)} className="mt-space-1 w-24" inputMode="numeric" /></label><Button variant="primary" onClick={saveRetention}>{t('common.save')}</Button><span className="text-caption text-muted">{t('settings.currentDays', { days: retention.days ?? t('common.notAvailable') })}</span></Toolbar></Panel>
    <section><h2 className="mb-space-2 text-label font-semibold">{t('settings.modelCatalog')}</h2><div className="grid gap-space-2 sm:grid-cols-2 lg:grid-cols-3">{catalog.map((model, index) => <Panel key={model.id ?? index} bodyClassName="px-space-3 py-space-2"><div className="flex items-center gap-space-2"><span className="font-mono text-primary">{model.shortName ?? model.label ?? model.id}</span>{model.id === models.default && <Chip>{t('settings.default')}</Chip>}</div><div className="mt-space-1 text-caption text-muted">{model.category ?? t('settings.model')} · {model.id}</div></Panel>)}</div></section>
    <Panel header={<h2 className="text-label font-semibold">{t('settings.system')}</h2>} bodyClassName="p-space-4"><dl className="grid gap-space-2 text-caption md:grid-cols-3"><Info label={t('settings.root')} value={health.root} /><Info label={t('settings.runsDir')} value={health.runs_dir} /><Info label={t('settings.port')} value={health.port} /></dl></Panel>
  </div>
}

function Info({ label, value }: { label: string; value?: string | number }) { return <div><dt className="text-muted">{label}</dt><dd className="mt-space-1 break-all font-mono text-caption text-secondary">{value ?? t('common.notAvailable')}</dd></div> }
