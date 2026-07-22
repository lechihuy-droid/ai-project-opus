import { useLocation } from 'react-router-dom'
import { ProviderDot } from '../lib/ui'

const titles: Record<string, string> = { chat: 'Chat Ãƒâ€žÃ¢â‚¬Ëœa cÃƒÂ¡Ã‚Â»Ã‚Â­a sÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢', sessions: 'PhiÃƒÆ’Ã‚Âªn Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ lÃƒâ€ Ã‚Â°u', workflows: 'Workflows', runs: 'Runs', agents: 'Agents', skills: 'Skills', approvals: 'ChÃƒÂ¡Ã‚Â»Ã‚Â duyÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡t', usage: 'Usage & quota', settings: 'CÃƒÆ’Ã‚Â i Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t' }

export default function Topbar() {
  const page = useLocation().pathname.split('/')[1] || 'runs'
  const title = titles[page] ?? 'Runs'
  return <header className="flex items-center gap-[14px] border-b border-border-subtle bg-sidebar px-[18px] py-[10px]"><span className="text-[13px] text-secondary">{title} / <b className="font-semibold text-primary">Harness Hub</b></span><div className="ml-auto flex gap-2">
    {/* TODO(U4): wire /api/usage quota. */}
    <span className="flex items-center gap-[7px] rounded-full border border-border-subtle bg-elevated px-[10px] py-[3px] font-mono text-[11px] text-secondary"><ProviderDot provider="claude" />claude ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</span><span className="flex items-center gap-[7px] rounded-full border border-border-subtle bg-elevated px-[10px] py-[3px] font-mono text-[11px] text-secondary"><ProviderDot provider="codex" />codex ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</span><span className="flex items-center gap-[7px] rounded-full border border-border-subtle bg-elevated px-[10px] py-[3px] font-mono text-[11px] text-secondary"><ProviderDot provider="nvidia" />nvidia free</span>
  </div></header>
}



