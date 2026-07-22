import { Button, Status } from '../lib/ui'

export default function GateCard({ interrupt, onChoice, resuming }: { interrupt: Record<string, unknown>; onChoice: (approved: boolean) => void; resuming: boolean }) {
  const payload = interrupt.payload && typeof interrupt.payload === 'object' ? interrupt.payload as Record<string, unknown> : {}; const prompt = String(payload.prompt ?? payload.objective ?? interrupt.reason ?? 'Workflow Ã„â€˜ang chÃ¡Â»Â quyÃ¡ÂºÂ¿t Ã„â€˜Ã¡Â»â€¹nh cÃ¡Â»Â§a bÃ¡ÂºÂ¡n.')
  return <div className="mt-3 rounded-[var(--hub-radius-lg)] border border-[var(--hub-warning)] bg-[var(--hub-warning-subtle)] p-3.5"><div className="flex items-center gap-2"><Status kind="setup-required" label="GATE Ã‚Â· chÃ¡Â»Â quyÃ¡ÂºÂ¿t Ã„â€˜Ã¡Â»â€¹nh" /></div><p className="my-2 text-[13px] text-secondary">{prompt}</p><div className="flex gap-2"><Button variant="primary" disabled={resuming} onClick={() => onChoice(true)}>{resuming ? 'Ã„Âang gÃ¡Â»Â­iÃ¢â‚¬Â¦' : 'DuyÃ¡Â»â€¡t'}</Button><Button variant="destructive" disabled={resuming} onClick={() => onChoice(false)}>TÃ¡Â»Â« chÃ¡Â»â€˜i</Button></div></div>
}


