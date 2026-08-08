import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

/** Shared density recipe: 12px muted headers and 40px data rows. */
export const tableHeaderClass = 'bg-elevated text-section font-semibold uppercase tracking-section text-muted'
export const tableRowClass = 'h-10 transition-colors hover:bg-hover data-[selected=true]:bg-accent-subtle'
export const tableCellClass = 'px-space-3 py-space-2 text-label leading-label'

export type TableProps = HTMLAttributes<HTMLTableElement> & {
  headers: ReactNode[]
  children: ReactNode
  wrapperClassName?: string
}

/** Table shell plus row/cell recipes. Set data-selected="true" on TableRow when selected. */
export default function Table({ headers, children, wrapperClassName, className, ...rest }: TableProps) {
  return <div className={cx('overflow-x-auto rounded-lg border border-border-subtle', wrapperClassName)}><table className={cx('w-full border-collapse text-left text-label', className)} {...rest}><thead className={tableHeaderClass}><tr>{headers.map((header, index) => <th key={index} className={cx(tableCellClass, 'font-semibold')}>{header}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{children}</tbody></table></div>
}

export function TableRow({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cx(tableRowClass, className)} {...rest} />
}

export function TableHeaderCell({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cx(tableCellClass, 'font-semibold', className)} {...rest} />
}

export function TableCell({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx(tableCellClass, className)} {...rest} />
}


