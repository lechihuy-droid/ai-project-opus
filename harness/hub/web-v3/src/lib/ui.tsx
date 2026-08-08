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
import { Loader2, X } from 'lucide-react'
import { forwardRef, isValidElement, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
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

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
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
