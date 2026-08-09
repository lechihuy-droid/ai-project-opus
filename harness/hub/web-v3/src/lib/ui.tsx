/**
 * ui.tsx — dependency-free React primitives built on the tokens defined in
 * `src/styles/tokens.css`. Styling approach: Tailwind arbitrary-value
 * utilities referencing CSS custom properties (e.g. `bg-[var(--hub-accent)]`)
 * — chosen over inline `style` objects so variants stay declarative,
 * greppable, and easy to diff. Inline `style` is not used anywhere in this
 * file; keep it that way when extending these components.
 *
 * See DESIGN.md for the full component contract, when-to-use rules, and
 * the migration checklist that points existing pages at these primitives.
 */
import { CheckCircle2, Info, Loader2, Search, TriangleAlert, X } from 'lucide-react'
import { cloneElement, forwardRef, isValidElement, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { t } from './i18n'
import type { ProviderId } from './uiHelpers'

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

// Ring hugs the visible control (offset 2px out from it) and is the only
// required focus signal — glow, if any, is decoration on top of this, never
// a replacement for it.
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'warning' | 'destructive'
/**
 * sm  — 30px, compact/dense contexts (inline toolbar rows, EmptyState actions).
 * md  — 32px, the standard control height. Default.
 * list — auto height, min 52px, for two-line selectable rows (e.g. the
 *   selected-workflow list item). Pairs with `selected` for the thin
 *   cyan border + faint cyan tint treatment.
 */
export type ButtonSize = 'sm' | 'md' | 'list'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  selected?: boolean
  /** Optional leading icon slot, rendered before the label and marked decorative. Replaced by a spinner while `loading`. */
  icon?: ReactNode
  /** Shows a spinner in place of `icon`, marks the control busy, and blocks activation without dimming it the way `disabled` does. */
  loading?: boolean
  children: ReactNode
}

const buttonBase = cx(
  'inline-flex items-center justify-center gap-[6px]',
  'rounded-md font-medium whitespace-nowrap transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-40',
  focusRing,
)

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-app hover:bg-accent-hover active:bg-accent-pressed',
  secondary: cx(
    'border border-border-strong bg-elevated',
    'text-primary hover:bg-hover hover:border-border-strong active:bg-hover active:border-accent',
  ),
  ghost: 'text-secondary hover:bg-hover hover:text-primary active:bg-hover active:text-primary',
  warning: cx(
    'border border-warning bg-transparent text-warning',
    'hover:bg-warning-subtle hover:text-warning active:bg-warning/20 active:text-warning',
  ),
  destructive: cx(
    'border border-error text-error',
    'hover:bg-error-subtle active:bg-error/20',
  ),
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-[30px] px-space-3 text-caption leading-caption',
  md: 'h-8 px-space-3 text-label leading-label',
  list: 'h-auto min-h-[52px] px-space-3 py-space-2 text-label leading-label',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', selected = false, icon, loading = false, disabled, onClick, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading && !disabled ? true : undefined}
      onClick={loading ? undefined : onClick}
      className={cx(
        buttonBase,
        selected ? 'border border-accent bg-accent-subtle text-primary' : buttonVariants[variant],
        buttonSizes[size],
        loading && 'cursor-wait pointer-events-none',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center"><Loader2 size={16} strokeWidth={2} className="animate-spin" /></span>
      ) : icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  )
})

// ---------------------------------------------------------------------------
// ListItem
// ---------------------------------------------------------------------------

export type ListItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Primary line. Consumer-provided visible strings must come from `t()`. */
  title: ReactNode
  /** Optional secondary line; omit it for a one-line row. */
  description?: ReactNode
  selected?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

/** Selectable list row; native button behaviour supplies Enter and Space activation. */
export const ListItem = forwardRef<HTMLButtonElement, ListItemProps>(function ListItem(
  { title, description, selected = false, leading, trailing, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'flex min-h-[52px] w-full items-center gap-space-2 rounded-md border px-space-3 py-space-2 text-left transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
        selected
          ? 'border-accent bg-accent-subtle text-primary hover:bg-accent-subtle active:bg-accent-subtle'
          : 'border-transparent text-primary hover:bg-hover active:bg-hover',
        className,
      )}
      {...rest}
    >
      {leading ? <span aria-hidden="true" className="inline-flex shrink-0">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label leading-label">{title}</span>
        {description ? <span className="mt-[2px] block truncate text-caption leading-caption text-secondary">{description}</span> : null}
      </span>
      {trailing ? <span aria-hidden="true" className="inline-flex shrink-0">{trailing}</span> : null}
    </button>
  )
})

// ---------------------------------------------------------------------------
// IconButton
// ---------------------------------------------------------------------------

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode
  variant?: 'default' | 'handle'
  /** Required — icon-only controls must always expose an accessible name. */
  'aria-label': string
}

/**
 * Visible box is 32×32 (icon ≈16-18px, radius 6px) but the real clickable
 * button stays 40×40 — a transparent-padding hit area, not a visual one.
 * Implementation: the <button> itself IS the 40×40 hit box (unstyled,
 * transparent, no border/background of its own); a centred inner <span>
 * carries the actual 32×32 visible box — background, border, radius, hover
 * colour. The focus-visible ring is scoped to that inner span (via the
 * `[&:focus-visible>span]:*` arbitrary variant below) so it hugs the 32px
 * control instead of ringing the invisible 40px hit box.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, variant = 'default', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-transparent',
        'outline-none disabled:cursor-not-allowed disabled:opacity-40',
        '[&:focus-visible>span]:outline [&:focus-visible>span]:outline-2 [&:focus-visible>span]:outline-offset-2 [&:focus-visible>span]:outline-accent',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          variant === 'handle'
            ? 'border border-accent bg-app text-primary'
            : 'text-secondary group-hover:bg-hover group-hover:text-primary group-active:bg-hover group-active:text-accent',
        )}
      >
        {icon}
      </span>
    </button>
  )
})

// ---------------------------------------------------------------------------
// Input / Select / Textarea
// ---------------------------------------------------------------------------

const controlBase = cx(
  'w-full rounded-md border border-border-subtle',
  'bg-elevated text-primary',
  'text-label leading-label',
  'placeholder:text-muted',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent',
  'disabled:cursor-not-allowed disabled:opacity-40',
)

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cx(controlBase, 'h-input px-space-3', className)}
      {...rest}
    />
  )
})

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cx(controlBase, 'h-input px-space-3', className)}
      {...rest}
    >
      {children}
    </select>
  )
})

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(
        controlBase,
        'min-h-composer-min px-space-3 py-space-2',
        className,
      )}
      {...rest}
    />
  )
})

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export type TabOption<T extends string = string> = {
  value: T
  label: ReactNode
  disabled?: boolean
  'aria-label'?: string
}

export type TabsProps<T extends string = string> = {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Required — names this navigation tab strip for assistive tech. */
  'aria-label': string
  className?: string
}

/** Underline navigation tabs. Use SegmentedControl for compact mode switches. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs<T extends string = string>(
  { options, value, onChange, className, ...rest }: TabsProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const selectAndFocus = (current: HTMLButtonElement, index: number) => {
    const tabs = current.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')
    if (!tabs) return
    onChange(options[index].value)
    tabs[index]?.focus()
  }

  const move = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!options.length) return
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const jump = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1
    if (!step && jump < 0) return
    // Arrow keys move one tab and wrap; Home/End land on an end and then scan
    // inward. The scan below only skips disabled tabs, so the step has to be
    // applied here or the key would re-select the tab it started on.
    let next = jump >= 0 ? jump : (index + step + options.length) % options.length
    const direction = step || (jump === 0 ? 1 : -1)
    for (let attempts = 0; attempts < options.length && options[next].disabled; attempts += 1) {
      next = (next + direction + options.length) % options.length
    }
    if (options[next].disabled) return
    event.preventDefault()
    selectAndFocus(event.currentTarget, next)
  }

  return (
    <div ref={ref} role="tablist" aria-label={rest['aria-label']} className={cx('flex h-9 items-end border-b border-border-subtle', className)}>
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={option['aria-label']}
            disabled={option.disabled}
            tabIndex={selected && !option.disabled ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={event => move(event, index)}
            className={cx(
              'inline-flex h-9 items-center border-b-2 px-space-2',
              'text-label leading-label transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-40',
              focusRing,
              selected
                ? 'border-accent font-medium text-primary'
                : 'border-transparent text-secondary hover:border-border-strong hover:text-primary active:border-accent active:text-primary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Panel / Toolbar / Divider
// ---------------------------------------------------------------------------

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  /** Landmark element. A docked sidebar should pass `aside` so it stays complementary content. */
  as?: 'section' | 'aside' | 'div'
  header?: ReactNode
  footer?: ReactNode
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
}

/** Surface shell with optional header and footer slots; children render in the body slot. */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { as: Element = 'section', header, footer, headerClassName, bodyClassName, footerClassName, className, children, ...rest },
  ref,
) {
  return (
    <Element ref={ref} className={cx('rounded-lg border border-border-subtle bg-surface', className)} {...rest}>
      {header ? <div className={cx('border-b border-border-subtle p-space-3', headerClassName)}>{header}</div> : null}
      <div className={cx('p-space-4', bodyClassName)}>{children}</div>
      {footer ? <div className={cx('border-t border-border-subtle p-space-3', footerClassName)}>{footer}</div> : null}
    </Element>
  )
})

export type ToolbarProps = HTMLAttributes<HTMLDivElement>

/** Desktop control row. Put related controls in ToolbarGroup to retain wider group spacing. */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('flex h-toolbar shrink-0 flex-nowrap items-center gap-space-3', className)} {...rest} />
})

export type ToolbarGroupProps = HTMLAttributes<HTMLDivElement>

export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(function ToolbarGroup({ className, ...rest }, ref) {
  return <div ref={ref} className={cx('flex shrink-0 items-center gap-space-2', className)} {...rest} />
})

export type DividerProps = HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider({ orientation = 'horizontal', className, ...rest }, ref) {
  return <div ref={ref} role="separator" aria-orientation={orientation} className={cx(orientation === 'horizontal' ? 'h-px w-full bg-border-subtle' : 'h-full w-px self-stretch bg-border-subtle', className)} {...rest} />
})

// ---------------------------------------------------------------------------
// SearchInput
// ---------------------------------------------------------------------------

export type SearchInputProps = Omit<InputProps, 'type' | 'value' | 'onChange'> & {
  value: string
  onChange: InputProps['onChange']
  onClear: () => void
  /** Accessible label for the clear icon button. */
  clearLabel?: string
}

/** Controlled search field that composes Input rather than duplicating its control styling. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onClear, clearLabel = t('misc.ui.clear'), className, disabled, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <Search aria-hidden="true" size={16} strokeWidth={1.75} className="pointer-events-none absolute left-space-3 top-1/2 -translate-y-1/2 text-muted" />
      <Input ref={ref} type="search" value={value} onChange={onChange} disabled={disabled} className={cx('pl-9', value ? 'pr-9' : undefined, className)} {...rest} />
      {value ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={clearLabel}
          onClick={onClear}
          className={cx('absolute right-[2px] top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md', 'text-secondary transition-colors hover:bg-hover hover:text-primary active:bg-accent-subtle active:text-accent disabled:cursor-not-allowed disabled:opacity-40', focusRing)}
        >
          <X aria-hidden="true" size={16} strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export type AlertVariant = 'error' | 'warning' | 'info' | 'success'
export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant
  title?: ReactNode
  onDismiss?: () => void
  /** Accessible label for the optional dismiss icon button. */
  dismissLabel?: string
}

const alertStyles: Record<AlertVariant, string> = {
  error: 'border-error bg-error-subtle',
  warning: 'border-warning bg-warning-subtle',
  info: 'border-info bg-elevated',
  success: 'border-success bg-elevated',
}

const alertIcon: Record<AlertVariant, ReactNode> = {
  error: <TriangleAlert size={16} strokeWidth={1.75} />, warning: <TriangleAlert size={16} strokeWidth={1.75} />,
  info: <Info size={16} strokeWidth={1.75} />, success: <CheckCircle2 size={16} strokeWidth={1.75} />,
}

const alertIconColor: Record<AlertVariant, string> = { error: 'text-error', warning: 'text-warning', info: 'text-info', success: 'text-success' }

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = 'info', title, onDismiss, dismissLabel = t('misc.ui.dismiss'), className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="alert" className={cx('flex items-start gap-space-2 rounded-md border p-space-3 text-caption leading-caption text-primary', alertStyles[variant], className)} {...rest}>
      <span aria-hidden="true" className={cx('mt-px shrink-0', alertIconColor[variant])}>{alertIcon[variant]}</span>
      <div className="min-w-0 flex-1">{title ? <div className="font-medium text-primary">{title}</div> : null}{children ? <div className={title ? 'mt-space-1 text-secondary' : 'text-secondary'}>{children}</div> : null}</div>
      {onDismiss ? <button type="button" aria-label={dismissLabel} onClick={onDismiss} className={cx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-secondary transition-colors hover:bg-hover hover:text-primary active:bg-accent-subtle active:text-accent', focusRing)}><X aria-hidden="true" size={16} strokeWidth={1.75} /></button> : null}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

export type ChipProps = {
  children: ReactNode
  selected?: boolean
  muted?: boolean
  /** Presence enables the removable variant and renders a close-icon affordance. */
  onRemove?: () => void
  /** Accessible label for the remove button. Defaults to the translated Remove label. */
  removeLabel?: string
  className?: string
}

export function Chip({ children, selected = false, muted = false, onRemove, removeLabel = t('misc.ui.remove'), className }: ChipProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-space-1 rounded-full',
        selected ? 'border border-accent bg-accent-subtle text-primary' : 'border border-border-subtle bg-elevated',
        'px-space-3 py-[3px] text-caption',
        !selected && (muted ? 'text-muted opacity-60' : 'text-secondary'),
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className={cx(
            // Opts out of the global button min-width:40px — a 40px invisible
            // hit zone would spill outside a ~22px chip and overlap neighbours
            // in a wrapped chip list, so this stays a small, honest hit box.
            'ml-[2px] inline-flex h-[18px] w-[18px] min-w-0 items-center justify-center rounded-full leading-none',
            'text-muted hover:bg-hover hover:text-primary',
            focusRing,
          )}
        >
          <X size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}

// ---------------------------------------------------------------------------
// SegmentedControl
// ---------------------------------------------------------------------------

export type SegmentedControlOption<T extends string = string> = {
  value: T
  label: ReactNode
  /** Overrides the accessible name for this segment; falls back to `label` when it's plain text. */
  'aria-label'?: string
}

export type SegmentedControlProps<T extends string = string> = {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Required — names the group for assistive tech, same contract as a native radiogroup label. */
  'aria-label': string
  className?: string
}

/**
 * Capsule switch for a small, fixed set of mutually-exclusive views (Design/Run,
 * Workflows/Components). Track renders as its own muted-navy surface; the
 * active segment sits *darker* than the track (closer to --hub-bg-app) with a
 * 2px cyan border, so selection reads as "punched through" the track rather
 * than painted on top of it.
 *
 * Semantics/keyboard match the roving-tabindex `role="tablist"`/`role="tab"`
 * pattern already used by every tab strip in this codebase (see the `moveTab`
 * helper duplicated in WorkflowsPage.tsx / ChatPage.tsx): ArrowLeft/ArrowRight
 * move and select with wraparound, Tab enters/exits the whole group once, and
 * only the active segment is in the tab order.
 */
export function SegmentedControl<T extends string = string>({ options, value, onChange, className, ...rest }: SegmentedControlProps<T>) {
  const move = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % options.length
      : event.key === 'ArrowLeft' ? (index + options.length - 1) % options.length
      : -1
    if (next < 0) return
    event.preventDefault()
    onChange(options[next].value)
    ;(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next])?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={rest['aria-label']}
      className={cx(
        'inline-flex h-9 items-center gap-[4px] rounded-[18px] border border-border-subtle bg-surface p-[3px]',
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={option['aria-label']}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={event => move(event, index)}
            className={cx(
              'inline-flex h-[30px] items-center justify-center whitespace-nowrap rounded-[15px] px-space-4',
              'text-label leading-label transition-colors',
              focusRing,
              selected
                ? 'border-2 border-accent bg-app text-accent font-semibold shadow-[0_0_6px_-1px_rgba(41,199,243,0.35)]'
                : 'border-2 border-transparent font-medium text-secondary hover:bg-hover hover:text-primary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type StatusKind =
  | 'ready'
  | 'running'
  | 'paused'
  | 'setup-required'
  | 'not-installed'
  | 'rate-limited'
  | 'error'
  | 'offline'

export type StatusProps = {
  kind: StatusKind
  /** Override the default Vietnamese label. The label is always rendered — colour is never the only signal. */
  label?: string
  className?: string
}

const statusDotClass: Record<StatusKind, string> = {
  ready: 'bg-success',
  running: 'bg-accent',
  paused: 'bg-muted',
  'setup-required': 'bg-warning',
  'not-installed': 'bg-muted',
  'rate-limited': 'bg-warning',
  error: 'bg-error',
  offline: 'bg-muted',
}

const statusLabels: Record<StatusKind, string> = {
  ready: t('misc.status.ready'),
  running: t('misc.status.running'),
  paused: t('misc.status.paused'),
  'setup-required': t('misc.status.setupRequired'),
  'not-installed': t('misc.status.notInstalled'),
  'rate-limited': t('misc.status.rateLimited'),
  error: t('misc.status.error'),
  offline: t('misc.status.offline'),
}

export function Status({ kind, label, className }: StatusProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[6px] text-caption text-secondary',
        className,
      )}
    >
      <span aria-hidden="true" className={cx('h-2 w-2 shrink-0 rounded-full', statusDotClass[kind])} />
      {label ?? statusLabels[kind]}
    </span>
  )
}

export type RunStatusKind = 'running' | 'success' | 'error' | 'interrupted' | 'queued' | 'neutral'
export type RunStatusBadgeProps = { kind: RunStatusKind; label: string; className?: string }

const runStatusBadgeClass: Record<RunStatusKind, string> = {
  running: 'border border-accent bg-accent-subtle text-primary', success: 'border border-success bg-surface text-primary', error: 'border border-error bg-error-subtle text-primary', interrupted: 'border border-warning bg-warning-subtle text-primary', queued: 'border border-border-strong bg-elevated text-secondary', neutral: 'border border-border-subtle bg-elevated text-secondary',
}
const runStatusBadgeMark: Record<RunStatusKind, string> = { running: '●', success: '✓', error: '!', interrupted: '◆', queued: '○', neutral: '?' }

export function RunStatusBadge({ kind, label, className }: RunStatusBadgeProps) {
  return <span className={cx('inline-flex items-center gap-[5px] rounded-full px-space-2 py-[2px] text-caption leading-caption', runStatusBadgeClass[kind], className)}><span aria-hidden="true" className="text-caption leading-none">{runStatusBadgeMark[kind]}</span>{label}</span>
}

// ---------------------------------------------------------------------------
// ProviderDot
// ---------------------------------------------------------------------------

export type ProviderDotProps = {
  provider: ProviderId
  className?: string
}

// Reuses the existing --color-claude/codex/nvidia tokens from
// index.css's @theme block via their Tailwind bg-* utilities — provider
// colour usage is restricted to this 6-8px identity dot everywhere else.
const providerDotClass: Record<ProviderId, string> = {
  claude: 'bg-claude',
  codex: 'bg-codex',
  nvidia: 'bg-nvidia',
}

export function ProviderDot({ provider, className }: ProviderDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cx('inline-block h-[7px] w-[7px] shrink-0 rounded-full', providerDotClass[provider], className)}
    />
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export type EmptyStateAction = {
  label: string
  onClick: () => void
  icon?: ReactNode
}

export type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  /** Only the first 4 actions are rendered. */
  actions?: EmptyStateAction[]
  className?: string
}

export function EmptyState({ icon, title, description, actions = [], className }: EmptyStateProps) {
  const visibleActions = actions.slice(0, 4)
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-space-2 text-center',
        'rounded-lg border border-dashed border-border-subtle',
        'px-space-4 py-space-8',
        className,
      )}
    >
      {icon ? <span aria-hidden="true" className="text-muted">{icon}</span> : null}
      <h3 className="text-label leading-label font-semibold text-primary">
        {title}
      </h3>
      {description ? (
        <p className="max-w-sm text-caption leading-caption text-secondary">
          {description}
        </p>
      ) : null}
      {visibleActions.length > 0 ? (
        <div className="mt-space-2 flex flex-wrap justify-center gap-space-2">
          {visibleActions.map(action => (
            <Button key={action.label} variant="ghost" size="sm" icon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Popover
// ---------------------------------------------------------------------------

type PopoverProps = {
  /** Rendered as the trigger. Receives the current open state so it can show a caret. */
  label: ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  triggerClassName?: string
  className?: string
  'aria-label'?: string
}

/**
 * Click-to-open disclosure anchored to its trigger. Use it to keep secondary
 * controls — model pickers, provider health, pane settings — out of the layout
 * until asked for, instead of stacking them permanently above the content.
 *
 * Trigger shape auto-detects from `label`: a bare icon element with no
 * children (e.g. `label={<Ellipsis size={16} />}`, as used by the topbar
 * search/provider triggers and every "⋯" overflow menu) renders through
 * `IconButton` — same 32×32 visible box in a 40×40 hit area, `group-hover`,
 * focus ring scoped to the visible box. Anything else — a plain string, or
 * an element that itself has children (icon+text wrapped in a Fragment or
 * span, e.g. the model selector or FolderPicker's trigger) — keeps the
 * original 32px-tall auto-width ghost text button, so it doesn't get forced
 * into a square it doesn't fit.
 */
export function Popover({ label, children, align = 'start', triggerClassName, className, ...rest }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const iconOnly = isValidElement(label) && (label.props as { children?: ReactNode }).children === undefined

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [open])

  return (
    <div ref={root} className="relative">
      {iconOnly ? (
        <IconButton
          icon={label}
          aria-label={rest['aria-label'] ?? ''}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(current => !current)}
          className={triggerClassName}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={rest['aria-label']}
          onClick={() => setOpen(current => !current)}
          className={triggerClassName}
        >
          {label}
        </Button>
      )}
      {open ? (
        <div
          className={cx(
            'absolute z-20 mt-space-1 min-w-[220px] rounded-[var(--hub-radius-lg)] border border-border-subtle bg-surface p-space-3 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dialog / Drawer
// ---------------------------------------------------------------------------

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function useOverlayFocus(open: boolean, onOpenChange: (open: boolean) => void, surface: React.RefObject<HTMLDivElement | null>) {
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      window.setTimeout(() => {
        const root = surface.current
        if (!root) return
        const target = root.querySelector<HTMLElement>('[autofocus], ' + focusableSelector)
        ;(target ?? root).focus()
      }, 0)
      return
    }
    if (returnFocus.current?.isConnected) returnFocus.current.focus()
    returnFocus.current = null
  }, [open, surface])

  useEffect(() => () => {
    if (returnFocus.current?.isConnected) returnFocus.current.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        return
      }
      if (event.key !== 'Tab') return
      const root = surface.current
      if (!root) return
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector))
      if (!focusable.length) {
        event.preventDefault()
        root.focus()
        return
      }
      const current = document.activeElement
      const index = focusable.indexOf(current as HTMLElement)
      const next = event.shiftKey ? (index <= 0 ? focusable.length - 1 : index - 1) : (index === focusable.length - 1 ? 0 : index + 1)
      event.preventDefault()
      focusable[next].focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange, surface])
}

type OverlayProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  headerClassName?: string
  footerClassName?: string
  closeOnScrimClick?: boolean
}

export type DialogProps = OverlayProps

/** Controlled modal with scrim, focus trap, Escape close, and focus return. */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  { open, onOpenChange, title, children, footer, className, headerClassName, footerClassName, closeOnScrimClick = true }, ref,
) {
  const surface = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useOverlayFocus(open, onOpenChange, surface)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-4">
      <div aria-hidden="true" onMouseDown={closeOnScrimClick ? () => onOpenChange(false) : undefined} className="absolute inset-0 bg-app/80" />
      <div ref={node => { surface.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('relative z-10 flex max-h-[calc(100vh-32px)] w-fit min-w-[min(320px,calc(100vw-32px))] max-w-[min(640px,calc(100vw-32px))] flex-col overflow-auto rounded-lg border border-border-subtle bg-elevated shadow-lg', className)}>
        <div className={cx('flex shrink-0 items-center border-b border-border-subtle px-space-4 py-space-2', headerClassName)}><h2 id={titleId} className="text-label font-semibold text-primary">{title}</h2></div>
        <div className="min-w-0 p-space-4 text-label text-secondary">{children}</div>
        {footer ? <div className={cx('flex shrink-0 items-center justify-end gap-space-2 border-t border-border-subtle px-space-4 py-space-2', footerClassName)}>{footer}</div> : null}
      </div>
    </div>
  )
})

export type DrawerProps = OverlayProps & { side?: 'right' | 'bottom' }

/** Controlled edge panel with the same modal focus contract as Dialog. */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  { side = 'right', open, onOpenChange, title, children, footer, className, headerClassName, footerClassName, closeOnScrimClick = true }, ref,
) {
  const surface = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [entered, setEntered] = useState(false)
  useOverlayFocus(open, onOpenChange, surface)
  useEffect(() => {
    if (!open) { setEntered(false); return }
    const frame = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(frame)
  }, [open])
  if (!open) return null
  const isRight = side === 'right'
  return (
    <div className="fixed inset-0 z-50 flex">
      <div aria-hidden="true" onMouseDown={closeOnScrimClick ? () => onOpenChange(false) : undefined} className="absolute inset-0 bg-app/80" />
      <div ref={node => { surface.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cx('relative z-10 flex overflow-auto rounded-lg border border-border-subtle bg-elevated shadow-lg transition-transform duration-200 ease-out', isRight ? cx('ml-auto h-full w-[min(420px,calc(100vw-16px))] flex-col rounded-r-none', entered ? 'translate-x-0' : 'translate-x-full') : cx('mt-auto max-h-[80vh] w-full flex-col rounded-b-none', entered ? 'translate-y-0' : 'translate-y-full'), className)}>
        <div className={cx('flex shrink-0 items-center border-b border-border-subtle px-space-4 py-space-2', headerClassName)}><h2 id={titleId} className="text-label font-semibold text-primary">{title}</h2></div>
        <div className="min-h-0 min-w-0 flex-1 overflow-auto p-space-4 text-label text-secondary">{children}</div>
        {footer ? <div className={cx('flex shrink-0 items-center justify-end gap-space-2 border-t border-border-subtle px-space-4 py-space-2', footerClassName)}>{footer}</div> : null}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Menu / Tooltip
// ---------------------------------------------------------------------------

export type MenuItem = { id: string; label: ReactNode; onSelect: () => void; disabled?: boolean; destructive?: boolean; 'aria-label'?: string }
export type MenuProps = { label: ReactNode; items: MenuItem[]; align?: 'start' | 'end'; className?: string; triggerClassName?: string; /** Required for an icon-only trigger. */ 'aria-label': string }

/** Action menu: unlike Popover, this owns menu semantics and arrow-key navigation. */
export function Menu({ label, items, align = 'start', className, triggerClassName, ...rest }: MenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const focusItem = (index: number) => window.setTimeout(() => root.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]')[index]?.focus(), 0)
  const close = () => { setOpen(false); window.setTimeout(() => trigger.current?.focus(), 0) }
  const openAt = (index: number) => { setOpen(true); focusItem(index) }
  const move = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = items.map((item, itemIndex) => !item.disabled ? itemIndex : -1).filter(itemIndex => itemIndex >= 0)
    if (!enabled.length) return
    let next: number | undefined
    if (event.key === 'ArrowDown') next = enabled[(enabled.indexOf(index) + 1 + enabled.length) % enabled.length]
    if (event.key === 'ArrowUp') next = enabled[(enabled.indexOf(index) - 1 + enabled.length) % enabled.length]
    if (event.key === 'Home') next = enabled[0]
    if (event.key === 'End') next = enabled[enabled.length - 1]
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (next === undefined) return
    event.preventDefault()
    root.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]')[next]?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) close() }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const iconOnly = isValidElement(label) && (label.props as { children?: ReactNode }).children === undefined
  const triggerProps = { ref: trigger, 'aria-label': rest['aria-label'], 'aria-expanded': open, 'aria-haspopup': 'menu' as const, onClick: () => open ? close() : openAt(items.findIndex(item => !item.disabled)), onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => { if (event.key === 'ArrowDown') { event.preventDefault(); openAt(items.findIndex(item => !item.disabled)) } if (event.key === 'ArrowUp') { event.preventDefault(); const last = [...items].map((item, index) => !item.disabled ? index : -1).filter(index => index >= 0).pop(); if (last !== undefined) openAt(last) } } }
  return <div ref={root} className="relative">{iconOnly ? <IconButton icon={label} className={triggerClassName} {...triggerProps} /> : <Button variant="ghost" size="sm" className={triggerClassName} {...triggerProps}>{label}</Button>}{open ? <div role="menu" className={cx('absolute z-20 mt-space-1 min-w-[180px] rounded-lg border border-border-subtle bg-elevated p-[3px] shadow-lg', align === 'end' ? 'right-0' : 'left-0', className)}>{items.map((item, index) => <button key={item.id} type="button" role="menuitem" aria-label={item['aria-label']} disabled={item.disabled} onKeyDown={event => move(event, index)} onClick={() => { item.onSelect(); close() }} className={cx('flex h-8 w-full items-center rounded-md px-space-2 text-left text-label transition-colors', 'hover:bg-hover active:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-40', focusRing, item.destructive ? 'text-error hover:text-error' : 'text-secondary hover:text-primary')}>{item.label}</button>)}</div> : null}</div>
}

export type TooltipProps = { content: ReactNode; children: ReactElement; className?: string }

/** Discovery text for an already-labelled control; it never replaces aria-label. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const described = isValidElement(children) ? cloneElement(children, { 'aria-describedby': open ? id : undefined } as never) : children
  return <span className="relative inline-flex" onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)} onFocusCapture={event => { if ((event.target as HTMLElement).matches(':focus-visible')) setOpen(true) }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>{described}{open ? <span id={id} role="tooltip" className={cx('pointer-events-none absolute bottom-full left-1/2 z-30 mb-space-1 w-max max-w-[240px] -translate-x-1/2 rounded-md border border-border-subtle bg-elevated px-space-2 py-space-1 text-caption leading-caption text-primary shadow-lg', className)}>{content}</span> : null}</span>
}

// ---------------------------------------------------------------------------
// Checkbox / Pagination
// ---------------------------------------------------------------------------

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: ReactNode; labelClassName?: string }

/** Native checkbox wrapped only for consistent visual states; native semantics stay intact. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, labelClassName, className, ...rest }, ref) {
  const control = <input ref={ref} type="checkbox" className={cx('h-4 w-4 shrink-0 rounded border-border-strong bg-elevated text-accent accent-accent transition-colors hover:border-border-strong active:accent-accent-pressed disabled:cursor-not-allowed disabled:opacity-40', focusRing, className)} {...rest} />
  return label ? <label className={cx('inline-flex items-center gap-[6px] text-label text-secondary', labelClassName)}>{control}<span>{label}</span></label> : control
})

export type PaginationProps = { page: number; pageCount: number; onChange: (page: number) => void; className?: string; 'aria-label'?: string; previousLabel?: string; nextLabel?: string }

/** Compact previous/current/next navigation for pageable tables. Pages are one-based. */
export function Pagination({ page, pageCount, onChange, className, 'aria-label': ariaLabel = t('misc.ui.pagination'), previousLabel = t('misc.ui.previous'), nextLabel = t('misc.ui.next') }: PaginationProps) {
  const current = Math.min(Math.max(page, 1), Math.max(pageCount, 1))
  return <nav aria-label={ariaLabel} className={cx('flex items-center gap-space-2 text-caption text-secondary', className)}><Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => onChange(current - 1)}>{previousLabel}</Button><span aria-current="page">{current}/{Math.max(pageCount, 1)}</span><Button variant="secondary" size="sm" disabled={current >= pageCount} onClick={() => onChange(current + 1)}>{nextLabel}</Button></nav>
}
