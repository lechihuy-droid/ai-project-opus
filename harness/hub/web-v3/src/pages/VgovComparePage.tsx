import { useState } from 'react'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, EmptyState, Input, Panel } from '../lib/ui'
import { vgov, type Diff } from '../lib/vgovApi'
import { ApiError } from '../lib/api'
import { t } from '../lib/i18n'

const render = (value: unknown) => value === undefined ? '—' : String(value)

export default function VgovComparePage() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [diff, setDiff] = useState<Diff | null>(null)
  const [error, setError] = useState('')

  const compare = async () => {
    try {
      setError('')
      setDiff(await vgov.compare(left, right))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('vgov.compareFailed'))
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-space-4 overflow-auto p-space-6">
      <div>
        <div className="text-section font-semibold uppercase tracking-section text-muted">{t('vgov.compareEyebrow')}</div>
        <h1 className="text-title font-semibold text-primary">{t('vgov.compareTitle')}</h1>
        <p className="mt-space-1 text-caption text-secondary">{t('vgov.compareSubtitle')}</p>
      </div>
      <Panel bodyClassName="grid gap-space-2 md:grid-cols-[1fr_1fr_auto]">
        <Input value={left} onChange={e => setLeft(e.target.value)} placeholder={t('vgov.leftPlaceholder')} aria-label={t('vgov.leftUuidLabel')} />
        <Input value={right} onChange={e => setRight(e.target.value)} placeholder={t('vgov.rightPlaceholder')} aria-label={t('vgov.rightUuidLabel')} />
        <Button variant="primary" onClick={() => void compare()} disabled={!left || !right}>{t('vgov.compareButton')}</Button>
      </Panel>
      {diff ? (
        <>
          <div className="text-label font-semibold text-primary">{diff.verdict}</div>
          <DiffTable title={t('vgov.changed')} rows={diff.changed} changed />
          <DiffTable title={t('vgov.unchanged')} rows={diff.unchanged} />
        </>
      ) : !error && <EmptyState title={t('vgov.emptyDiffTitle')} description={t('vgov.emptyDiffDesc')} />}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}

function DiffTable({ title, rows, changed = false }: { title: string; rows: Diff['changed']; changed?: boolean }) {
  return (
    <Panel header={<h2 className={`text-label font-semibold ${changed ? 'text-warning' : 'text-secondary'}`}>{title}</h2>} bodyClassName="p-0">
      <Table headers={[t('vgov.categoryHeader'), changed ? t('vgov.fromHeader') : t('vgov.valueHeader'), changed ? t('vgov.toHeader') : t('vgov.facetHeader')]} wrapperClassName="rounded-none border-0">
        {rows.map((row, index) => <TableRow key={`${row.category}-${row.facet}-${index}`}><TableCell className="font-semibold text-primary">{row.category}</TableCell><TableCell className="break-all text-secondary">{changed ? render(row.from) : render(row.value)}</TableCell><TableCell className="break-all text-secondary">{changed ? render(row.to) : row.facet}</TableCell></TableRow>)}
      </Table>
    </Panel>
  )
}
