import { NavLink } from 'react-router-dom'
import { Status } from '../lib/ui'

const zones = [
  { label: 'TRÃƒÆ’Ã¢â‚¬â„¢ CHUYÃƒÂ¡Ã‚Â»Ã¢â‚¬Â N', items: [['ÃƒÂ¢Ã¢â‚¬â€Ã¢â‚¬Â°', 'Chat Ãƒâ€žÃ¢â‚¬Ëœa cÃƒÂ¡Ã‚Â»Ã‚Â­a sÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢', '/chat'], ['ÃƒÂ¢Ã¢â‚¬Â Ã‚Âª', 'PhiÃƒÆ’Ã‚Âªn Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ lÃƒâ€ Ã‚Â°u', '/sessions']] },
  { label: 'Ãƒâ€žÃ‚ÂIÃƒÂ¡Ã‚Â»Ã¢â€šÂ¬U PHÃƒÂ¡Ã‚Â»Ã‚ÂI', items: [['ÃƒÂ¢Ã…â€™Ã‹Å“', 'Workflows', '/workflows'], ['ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¶', 'Runs', '/runs'], ['ÃƒÂ¢Ã…â€œÃ‚Â¦', 'Agents', '/agents'], ['ÃƒÂ¢Ã¢â‚¬â€Ã‹â€ ', 'Skills', '/skills']] },
  { label: 'GIÃƒÆ’Ã‚ÂM SÃƒÆ’Ã‚ÂT', items: [['ÃƒÂ¢Ã¢â‚¬â€Ã‹â€ ', 'ChÃƒÂ¡Ã‚Â»Ã‚Â duyÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡t', '/approvals'], ['ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¾', 'Usage & quota', '/usage']] },
  { label: 'HÃƒÂ¡Ã‚Â»Ã¢â‚¬Â  THÃƒÂ¡Ã‚Â»Ã‚ÂNG', items: [['ÃƒÂ¢Ã…Â¡Ã¢â€žÂ¢', 'CÃƒÆ’Ã‚Â i Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t', '/settings']] },
] as const

export default function Sidebar() {
  return <aside className="flex flex-col gap-0 overflow-y-auto border-r border-border-subtle bg-sidebar px-[10px] py-[14px]">
    <div className="flex items-center gap-[10px] px-[10px] pb-4 pt-2"><div className="grid h-[34px] w-[34px] place-items-center rounded-[var(--hub-radius-lg)] bg-[var(--hub-accent)] font-bold text-app">H</div><div><div className="font-semibold">Harness Hub</div><Status kind="ready" label="3 provider online" /></div></div>
    {zones.map((zone) => <div key={zone.label}><div className="px-[10px] pb-[5px] pt-[14px] text-[length:var(--hub-section-size)] font-semibold uppercase tracking-[var(--hub-section-tracking)] text-muted">{zone.label}</div>{zone.items.map(([icon, label, to]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item flex w-full items-center gap-[9px] rounded-[var(--hub-radius-md)] px-[10px] py-[7px] text-left text-secondary no-underline hover:bg-elevated hover:text-primary ${isActive ? 'bg-[var(--hub-accent-subtle)] font-semibold text-primary' : ''}`}><span className="w-4 text-center opacity-85">{icon}</span>{label}</NavLink>)}</div>)}
    <div className="mt-auto border-t border-border-subtle px-[10px] pb-1 pt-3 text-[11px] text-muted">Hub v3 Ãƒâ€šÃ‚Â· localhost:8799</div>
  </aside>
}



