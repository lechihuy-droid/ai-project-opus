import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { artifactSummary, isArtifact } from '../lib/artifact'
import { api } from '../lib/api'
import { Status } from '../lib/ui'

const zones = [
  { label: 'TỔNG QUAN', items: [['◉', 'Overview', '/overview']] },
  { label: 'TRÒ CHUYỆN', items: [['◉', 'Chat đa cửa sổ', '/chat'], ['↪', 'Phiên đã lưu', '/sessions']] },
  { label: 'ĐIỀU PHỐI', items: [['⌘', 'Workflows', '/workflows'], ['▤', 'Artifacts', '/artifacts'], ['▶', 'Runs', '/runs'], ['✦', 'Agents', '/agents'], ['◇', 'Skills', '/skills'], ['⌁', 'Hooks', '/hooks'], ['□', 'Files', '/files']] },
  { label: 'GIÁM SÁT', items: [['◇', 'Chờ duyệt', '/approvals'], ['▾', 'Usage & quota', '/usage']] },
  { label: 'HỆ THỐNG', items: [['⚙', 'Cài đặt', '/settings']] },
] as const

type Chat = { id: string; messages?: { role: string; content: string; streaming?: boolean }[] }
const recentArtifacts = () => { try { const chats = JSON.parse(localStorage.getItem('hub-v3-chats') ?? '[]') as Chat[]; return (Array.isArray(chats) ? chats : []).flatMap(chat => (chat.messages ?? []).filter(isArtifact).map(message => artifactSummary(message.content).title)).slice(-5).reverse() } catch { return [] } }
const link = (active: boolean) => `nav-item flex w-full items-center gap-[9px] rounded-[var(--hub-radius-md)] px-[10px] py-[7px] text-left text-secondary no-underline hover:bg-elevated hover:text-primary ${active ? 'bg-[var(--hub-accent-subtle)] font-semibold text-primary' : ''}`

export default function Sidebar() {
  const recent = useMemo(recentArtifacts, [])
  const [providers, setProviders] = useState<{ available: boolean }[] | null>(null)
  useEffect(() => { void api<{ available: boolean }[]>('/api/providers').then(setProviders).catch(() => setProviders(null)) }, [])
  return <aside className="flex w-[240px] flex-col gap-0 overflow-y-auto border-r border-border-subtle bg-sidebar px-[10px] py-[14px]">
    <div className="flex items-center gap-[10px] px-[10px] pb-4 pt-2"><div className="grid h-[34px] w-[34px] place-items-center rounded-[var(--hub-radius-lg)] bg-[var(--hub-accent)] font-bold text-app">H</div><div><div className="font-semibold">Harness Hub</div><Status kind="ready" label={providers ? `${providers.filter(provider => provider.available).length} provider online` : '—'} /></div></div>
    {zones.map(zone => <div key={zone.label}><div className="px-[10px] pb-[5px] pt-[14px] text-section font-semibold uppercase tracking-section text-muted">{zone.label}</div>{zone.items.map(([icon, label, to]) => <NavLink key={to} to={to} className={({ isActive }) => link(isActive)}><span className="w-4 text-center opacity-85">{icon}</span>{label}</NavLink>)}</div>)}
    {recent.length > 0 && <div><div className="px-[10px] pb-[5px] pt-[14px] text-section font-semibold uppercase tracking-section text-muted">RECENT</div>{recent.map((title, index) => <NavLink key={`${title}:${index}`} to="/artifacts" className={() => `${link(false)} block truncate`} title={title}>{title}</NavLink>)}</div>}
    <div className="mt-auto border-t border-border-subtle px-[10px] pb-1 pt-3 text-[11px] text-muted">Hub v3 · localhost:8799</div>
  </aside>
}
