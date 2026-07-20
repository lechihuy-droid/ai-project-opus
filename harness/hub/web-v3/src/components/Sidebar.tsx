import { NavLink } from 'react-router-dom'

const zones = [
  { label: 'TRÒ CHUYỆN', items: [['◉', 'Chat đa cửa sổ', '/chat'], ['↪', 'Phiên đã lưu', '/sessions']] },
  { label: 'ĐIỀU PHỐI', items: [['⌘', 'Workflows', '/workflows'], ['▶', 'Runs', '/runs'], ['✦', 'Agents', '/agents'], ['◈', 'Skills', '/skills']] },
  { label: 'GIÁM SÁT', items: [['◈', 'Chờ duyệt', '/approvals'], ['▾', 'Usage & quota', '/usage']] },
  { label: 'HỆ THỐNG', items: [['⚙', 'Cài đặt', '/settings']] },
] as const

export default function Sidebar() {
  return <aside className="flex flex-col gap-0 overflow-y-auto border-r border-line bg-panel px-[10px] py-[14px]">
    <div className="flex items-center gap-[10px] px-[10px] pb-4 pt-2"><div className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-gradient-to-br from-claude to-codex font-bold text-ink">H</div><div><div className="font-semibold">Harness Hub</div><div className="flex items-center gap-[5px] text-[11px] text-ok"><span className="h-[6px] w-[6px] rounded-full bg-ok" />3 provider online</div></div></div>
    {zones.map((zone) => <div key={zone.label}><div className="px-[10px] pb-[5px] pt-[14px] text-[10px] font-semibold uppercase tracking-[.14em] text-faint">{zone.label}</div>{zone.items.map(([icon, label, to]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item flex w-full items-center gap-[9px] rounded-lg px-[10px] py-[7px] text-left text-dim no-underline hover:bg-panel2 hover:text-text ${isActive ? 'bg-panel2 font-semibold text-text' : ''}`}><span className="w-4 text-center opacity-85">{icon}</span>{label}</NavLink>)}</div>)}
    <div className="mt-auto border-t border-line px-[10px] pb-1 pt-3 text-[11px] text-faint">Hub v3 · localhost:8799</div>
  </aside>
}
