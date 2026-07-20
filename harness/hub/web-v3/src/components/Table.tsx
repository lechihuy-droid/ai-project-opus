import type { ReactNode } from 'react'
export default function Table({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="overflow-x-auto rounded-lg border border-line"><table className="w-full border-collapse text-left text-xs"><thead className="bg-panel2 text-[10px] uppercase tracking-wider text-faint"><tr>{headers.map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{children}</tbody></table></div> }

