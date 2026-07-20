import type { ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[(?:[^\]]+)\]\((?:https?:\/\/[^)]+)\))/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-panel2 px-1 py-px font-mono text-codex">{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-gemini underline">{link[1]}</a>
    return part
  })
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n'); const nodes: ReactNode[] = []; let i = 0
  while (i < lines.length) {
    if (lines[i].startsWith('```')) {
      const code: string[] = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++])
      i++
      nodes.push(<CodeBlock key={nodes.length} text={code.join('\n')} />); continue
    }
    const heading = lines[i].match(/^(#{1,3})\s+(.+)$/)
    if (heading) { const Tag = `h${heading[1].length}` as 'h1' | 'h2' | 'h3'; nodes.push(<Tag key={nodes.length} className="mb-2 mt-3 font-semibold text-text">{inline(heading[2])}</Tag>); i++; continue }
    if (/^[-*]\s+/.test(lines[i])) { const items: ReactNode[] = []; while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(<li key={items.length}>{inline(lines[i++].slice(2))}</li>); nodes.push(<ul key={nodes.length} className="list-disc space-y-1 pl-5">{items}</ul>); continue }
    if (!lines[i].trim()) { i++; continue }
    const paragraph: string[] = []; while (i < lines.length && lines[i].trim() && !lines[i].startsWith('```') && !/^(#{1,3})\s+/.test(lines[i]) && !/^[-*]\s+/.test(lines[i])) paragraph.push(lines[i++])
    nodes.push(<p key={nodes.length} className="my-2 whitespace-pre-wrap text-dim">{inline(paragraph.join('\n'))}</p>)
  }
  return <>{nodes}</>
}

function CodeBlock({ text }: { text: string }) {
  const copy = () => void navigator.clipboard?.writeText(text)
  return <div className="relative my-2 rounded-lg border border-line bg-panel2 p-3"><button onClick={copy} className="absolute right-2 top-2 rounded border border-line px-2 py-1 text-[10px] text-dim">Copy</button><pre className="overflow-x-auto whitespace-pre-wrap pr-12 font-mono text-xs text-text">{text}</pre></div>
}

