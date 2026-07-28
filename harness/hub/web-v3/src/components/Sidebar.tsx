import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../lib/api'
import { Status } from '../lib/ui'

const zones = [
  { label: 'TỔNG QUAN', items: [['◉', 'Overview', '/overview']] },
  { label: 'TRÒ CHUYỆN', items: [['◉', 'Chat đa cửa sổ', '/chat'], ['↪', 'Phiên đã lưu', '/sessions']] },
  { label: 'ĐIỀU PHỐI', items: [['⌘', 'Workflows', '/workflows'], ['▤', 'Artifacts', '/artifacts'], ['▶', 'Runs', '/runs'], ['✦', 'Agents', '/agents'], ['◇', 'Skills', '/skills'], ['⌁', 'Hooks', '/hooks'], ['□', 'Files', '/files']] },
  { label: 'GIÁM SÁT', items: [['◇', 'Chờ duyệt', '/approvals'], ['▾', 'Usage & quota', '/usage']] },
  { label: 'HỆ THỐNG', items: [['⚙', 'Cài đặt', '/settings']] },
] as const

type Artifact = { id: string; title: string }
const recentArtifacts = (): Artifact[] => { try { const cached = JSON.parse(localStorage.getItem('hub-v3-artifacts') ?? 'null'); if (Array.isArray(cached)) return cached.slice(-5).reverse(); const chats = JSON.parse(localStorage.getItem('hub-v3-chats') ?? '[]') as { messages?: { role: string; content: string; streaming?: boolean }[] }[]; return chats.flatMap(chat => (chat.messages ?? []).filter(message => message.role === 'assistant' && !message.streaming && message.content.length >= 1200).map((message, index) => ({ id: `${index}:${message.content.slice(0, 20)}`, title: message.content.split('\n').find(Boolean)?.slice(0, 60) || 'Tài liệu' }))).slice(-5).reverse() } catch { return [] } }
const link = (active: boolean) => `nav-item flex w-full items-center gap-[9px] rounded-[var(--hub-radius-md)] px-[10px] py-[7px] text-left text-secondary no-underline hover:bg-elevated hover:text-primary ${active ? 'bg-[var(--hub-accent-subtle)] font-semibold text-primary' : ''}`

export default function Sidebar() {
  const [recent, setRecent] = useState<Artifact[]>(recentArtifacts)
  const [providers, setProviders] = useState<{ available: boolean }[] | null>(null)
  useEffect(() => { void api<{ available: boolean }[]>('/api/providers').then(setProviders).catch(() => setProviders(null)); void api<{ artifacts: Artifact[] }>('/api/artifacts').then(data => { localStorage.setItem('hub-v3-artifacts', JSON.stringify(data.artifacts)); setRecent(data.artifacts.slice(-5).reverse()) }).catch(() => undefined) }, [])
  return <aside className="flex w-[240px] flex-col gap-0 overflow-y-auto border-r border-border-subtle bg-sidebar px-[10px] py-[14px]">
    <div className="flex items-center gap-[10px] px-[10px] pb-4 pt-2"><div className="grid h-[34px] w-[34px] place-items-center rounded-[var(--hub-radius-lg)] bg-[var(--hub-accent)] font-bold text-app">H</div><div><div className="font-semibold">Harness Hub</div><Status kind="ready" label={providers ? `${providers.filter(provider => provider.available).length} provider online` : '—'} /></div></div>
    {zones.map(zone => <div key={zone.label}><div className="px-[10px] pb-[5px] pt-[14px] text-section font-semibold uppercase tracking-section text-muted">{zone.label}</div>{zone.items.map(([icon, label, to]) => <NavLink key={to} to={to} className={({ isActive }) => link(isActive)}><span className="w-4 text-center opacity-85">{icon}</span>{label}</NavLink>)}</div>)}
    {recent.length > 0 && <div><div className="px-[10px] pb-[5px] pt-[14px] text-section font-semibold uppercase tracking-section text-muted">RECENT</div>{recent.map(item => <NavLink key={item.id} to="/artifacts" className={() => `${link(false)} block truncate`} title={item.title}>{item.title}</NavLink>)}</div>}
    <div className="mt-auto border-t border-border-subtle px-[10px] pb-1 pt-3 text-[11px] text-muted">Hub v3 · localhost:8799</div>
  </aside>
}
