import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { Input, Popover, Status } from '../lib/ui'

const titles: Record<string, string> = { overview: 'Overview', chat: 'Chat đa cửa sổ', sessions: 'Phiên đã lưu', workflows: 'Workflows', artifacts: 'Artifacts', runs: 'Runs', agents: 'Agents', skills: 'Skills', hooks: 'Hooks', files: 'Files', approvals: 'Chờ duyệt', usage: 'Usage & quota', settings: 'Cài đặt' }
const tabs = [['Chat', '/chat'], ['Workflows', '/workflows'], ['Artifacts', '/artifacts'], ['Agents', '/agents'], ['Skills', '/skills'], ['Hooks', '/hooks'], ['Files', '/files'], ['Settings', '/settings']] as const

export default function Topbar() {
  const [providers, setProviders] = useState<{ id: string; available: boolean; detail?: string }[] | null>(null); const [providersError, setProvidersError] = useState('')
  useEffect(() => { void api<{ id: string; available: boolean; detail?: string }[]>('/api/providers').then(setProviders).catch(error => setProvidersError(error instanceof ApiError ? error.message : 'Không thể tải provider')) }, [])
  const page = useLocation().pathname.split('/')[1] || 'runs'; const title = titles[page] ?? 'Runs'
  return <header className="flex h-toolbar shrink-0 items-center gap-space-4 overflow-hidden border-b border-border-subtle bg-sidebar px-[18px]">
    <span className="shrink-0 text-label text-secondary"><b className="font-semibold text-primary">Harness Hub</b> / {title}</span>
    <nav className="flex min-w-0 flex-1 items-stretch justify-center gap-space-1 self-stretch overflow-hidden" aria-label="Điều hướng chính">{tabs.map(([label, to]) => <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center border-b-2 px-space-2 text-caption no-underline ${isActive ? 'border-accent text-primary' : 'border-transparent text-secondary hover:text-primary'}`}>{label}</NavLink>)}</nav>
    <div className="flex shrink-0 items-center gap-space-1"><Popover aria-label="Tìm kiếm toàn cục" label="⌕" className="w-[280px]"><Input aria-label="Tìm kiếm toàn cục" placeholder="Tìm kiếm…" /><p className="mt-space-2 text-caption text-muted">Tìm kiếm toàn cục chưa nối backend</p></Popover><Popover aria-label="Trạng thái provider" align="end" label="●"><div className="space-y-space-2">{providersError ? <p className="text-caption text-error">{providersError}</p> : <><Status kind="ready" label={providers ? `${providers.filter(provider => provider.available).length} provider online` : '—'} />{providers?.map(provider => <div key={provider.id} className="text-caption text-secondary">{provider.id} · {provider.available ? 'available' : provider.detail || 'unavailable'}</div>)}</>}</div></Popover><span aria-label="Người dùng" className="grid h-8 w-8 place-items-center rounded-full bg-elevated text-caption font-semibold text-primary">U</span></div>
  </header>
}
