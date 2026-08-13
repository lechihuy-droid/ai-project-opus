import { ChevronRight, FolderOpen, FolderUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { Button, Dialog, EmptyState, Input, Popover } from '../lib/ui'

type Directory = { name: string; path: string }
type DirectoryListing = { path: string | null; parent: string | null; entries: Directory[]; inside_root?: boolean }
// Every string this component renders, named. It used to be Record<string, any>,
// which type-checks any caller and hands back `any` for keys nobody passed --
// so a caller that forgot grantBody compiled cleanly and then threw
// "Cannot read properties of undefined (reading 'replace')" the moment the
// picker rendered, taking the whole Workflows page down with it.
type Copy = {
  choose: string
  path: string
  up: string
  select: string
  cancel: string
  folderAsContext: string
  folderAsScope: string
  noFolders: string
  grantTitle: string
  grantBody: string
  grantConfirm: string
  grantCancel: string
}

const labelFor = (path: string) => path.replace(/[\\/]+$/, '').split(/[\\/]/).at(-1) || path
const crumbsFor = (path: string) => { const normalized = path.replace(/\\/g, '/'); const parts = normalized.split('/').filter(Boolean); const windowsDrive = /^[A-Za-z]:$/.test(parts[0] ?? ''); let current = windowsDrive ? `${parts.shift()}\\` : normalized.startsWith('/') ? '/' : ''; return parts.map(part => { current = current === '/' ? `/${part}` : current ? `${current}${windowsDrive ? '\\' : '/'}${part}` : part; return { label: part, path: current } }) }

export default function FolderPicker({ value, workflowId = '', onChange, onGrantStatusChange = () => undefined, folderAsContext, onFolderAsContextChange, folderAsScope, onFolderAsScopeChange, copy }: { value: string | null; workflowId?: string; onChange: (value: string | null, insideRoot?: boolean) => void; onGrantStatusChange?: (value: boolean) => void; folderAsContext: boolean; onFolderAsContextChange: (value: boolean) => void; folderAsScope: boolean; onFolderAsScopeChange: (value: boolean) => void; copy: Copy }) {
  const [listing, setListing] = useState<DirectoryListing>({ path: null, parent: null, entries: [] }); const [path, setPath] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [pending, setPending] = useState<string | null>(null)
  const load = async (target: string | null) => { setLoading(true); setError(''); try { const data = await api<DirectoryListing>(`/api/fs/dirs${target ? `?path=${encodeURIComponent(target)}&show_hidden=false` : '?show_hidden=false'}`); setListing(data); setPath(data.path ?? '') } catch (reason) { setError(reason instanceof ApiError ? reason.message : String(reason)) } finally { setLoading(false) } }
  useEffect(() => { void load(null) }, [])
  const browsePath = () => { if (path.trim()) void load(path.trim()) }
  const choose = async (close: () => void) => { if (!listing.path) return; const activeWorkflow = workflowId || document.querySelector('.text-sm.font-semibold')?.textContent?.trim() || ''; if (!activeWorkflow) return; try { const result = await api<{ path: string; granted: boolean }>(`/api/workflows/${encodeURIComponent(activeWorkflow)}/folder-grants/check?path=${encodeURIComponent(listing.path)}`); if (result.granted) { onGrantStatusChange(true); onChange(result.path, listing.inside_root !== false); close() } else { setPending(result.path) } } catch (reason) { setError(reason instanceof ApiError ? reason.message : String(reason)) } }
  const confirmGrant = async () => { if (!pending) return; const activeWorkflow = workflowId || document.querySelector('.text-sm.font-semibold')?.textContent?.trim() || ''; if (!activeWorkflow) return; try { const grant = await api<{ path: string }>(`/api/workflows/${encodeURIComponent(activeWorkflow)}/folder-grants`, { method: 'POST', body: JSON.stringify({ path: pending }) }); onGrantStatusChange(true); onChange(grant.path, listing.inside_root !== false); setPending(null) } catch (reason) { setError(reason instanceof ApiError ? reason.message : String(reason)) } }
  return <><Popover label={<><FolderOpen size={16} strokeWidth={1.75} aria-hidden="true" />{value ? labelFor(value) : copy.choose}</>} aria-label={copy.choose} className="w-[360px] max-h-[520px] overflow-y-auto">{close => <div className="space-y-space-3"><div className="flex items-center gap-space-1"><Button variant="ghost" size="sm" icon={<FolderUp size={16} strokeWidth={1.75} />} aria-label={copy.up} title={copy.up} disabled={!listing.parent || loading} onClick={() => { if (listing.parent) void load(listing.parent) }}>{copy.up}</Button><div className="min-w-0 flex flex-1 items-center overflow-x-auto text-caption text-secondary">{listing.path ? crumbsFor(listing.path).map((crumb, index, crumbs) => <span key={crumb.path} className="inline-flex min-w-0 items-center"><Button variant="ghost" size="sm" className="h-auto px-1 py-0" onClick={() => void load(crumb.path)}>{crumb.label}</Button>{index < crumbs.length - 1 && <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />}</span>) : null}</div></div><Input value={path} onChange={event => setPath(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); browsePath() } }} placeholder={copy.path} aria-label={copy.path} /><div className="space-y-1">{listing.entries.length ? listing.entries.map(entry => <Button key={entry.path} variant="ghost" size="sm" className="w-full justify-start" icon={<FolderOpen size={16} strokeWidth={1.75} aria-hidden="true" />} onClick={() => void load(entry.path)}>{entry.name}</Button>) : <EmptyState icon={<FolderOpen size={20} strokeWidth={1.75} />} title={copy.noFolders} className="py-space-4" />}</div><div className="space-y-space-2 border-t border-border-subtle pt-space-3 text-caption text-secondary"><label className="flex items-center gap-space-2"><input type="checkbox" checked={folderAsContext} onChange={event => onFolderAsContextChange(event.target.checked)} />{copy.folderAsContext}</label><label className="flex items-center gap-space-2"><input type="checkbox" checked={folderAsScope} onChange={event => onFolderAsScopeChange(event.target.checked)} />{copy.folderAsScope}</label></div>{error && <p className="text-caption text-error">{error}</p>}<div className="flex justify-end gap-space-2 border-t border-border-subtle pt-space-3"><Button variant="ghost" size="sm" onClick={close}>{copy.cancel}</Button><Button variant="primary" size="sm" disabled={!listing.path || !listing.parent || loading} onClick={() => void choose(close)}>{copy.select}</Button></div></div>}</Popover><Dialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null) }} title={copy.grantTitle} footer={<><Button variant="ghost" onClick={() => setPending(null)}>{copy.grantCancel}</Button><Button variant="primary" onClick={() => void confirmGrant()}>{copy.grantConfirm}</Button></>}><p>{copy.grantBody.replace('{workflow}', workflowId).replace('{path}', pending ?? '')}</p></Dialog></>
}
