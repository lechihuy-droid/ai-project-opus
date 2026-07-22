import { useLocation } from 'react-router-dom'
import { ProviderDot } from '../lib/ui'

const titles: Record<string, string> = { chat: 'Chat đa cửa sổ', sessions: 'Phiên đã lưu', workflows: 'Workflows', runs: 'Runs', agents: 'Agents', skills: 'Skills', approvals: 'Chờ duyệt', usage: 'Usage & quota', settings: 'Cài đặt' }

export default function Topbar() {
  const page = useLocation().pathname.split('/')[1] || 'runs'
  const title = titles[page] ?? 'Runs'
  return <header className="flex items-center gap-[14px] border-b border-line bg-panel px-[18px] py-[10px]"><span className="text-[13px] text-dim">{title} / <b className="font-semibold text-text">Harness Hub</b></span><div className="ml-auto flex gap-2">
    {/* TODO(U4): wire /api/usage quota. */}
    <span className="flex items-center gap-[7px] rounded-full border border-line bg-panel2 px-[10px] py-[3px] font-mono text-[11px] text-dim"><ProviderDot provider="claude" />claude —</span><span className="flex items-center gap-[7px] rounded-full border border-line bg-panel2 px-[10px] py-[3px] font-mono text-[11px] text-dim"><ProviderDot provider="codex" />codex —</span><span className="flex items-center gap-[7px] rounded-full border border-line bg-panel2 px-[10px] py-[3px] font-mono text-[11px] text-dim"><ProviderDot provider="nvidia" />nvidia free</span>
  </div></header>
}
