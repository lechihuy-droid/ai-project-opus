export type PagePhase = 'U1' | 'U2' | 'U3' | 'U4'

export default function PlaceholderPage({ eyebrow, title, phase }: { eyebrow: string; title: string; phase: PagePhase }) { return <div className="p-7"><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-faint">{eyebrow}</div><h1 className="m-0 text-[24px] font-semibold text-text">{title}</h1><p className="mt-2 text-dim">Sẽ build ở phase {phase}</p></div> }
