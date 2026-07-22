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
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hub-accent)]'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Optional leading icon slot, rendered before the label and marked decorative. */
  icon?: ReactNode
  children: ReactNode
}

const buttonBase = cx(
  'inline-flex items-center justify-center gap-[var(--hub-space-2)]',
  'rounded-[var(--hub-radius-md)] font-medium whitespace-nowrap transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-40',
  focusRing,
)

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--hub-accent)] text-[var(--hub-bg-app)] hover:bg-[var(--hub-accent-hover)]',
  secondary: cx(
    'border border-[var(--hub-border-strong)] bg-[var(--hub-bg-elevated)]',
    'text-[var(--hub-text-primary)] hover:bg-[var(--hub-bg-hover)]',
  ),
  ghost: 'text-[var(--hub-text-secondary)] hover:bg-[var(--hub-bg-hover)] hover:text-[var(--hub-text-primary)]',
  destructive: cx(
    'border border-[var(--hub-error)] text-[var(--hub-error)]',
    'hover:bg-[var(--hub-error-subtle)]',
  ),
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-[var(--hub-space-3)] text-[length:var(--hub-caption-size)] leading-[var(--hub-caption-line)]',
  md: 'h-10 px-[var(--hub-space-4)] text-[length:var(--hub-label-size)] leading-[var(--hub-label-line)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    >
      {icon ? <span aria-hidden="true" className="inline-flex shrink-0 items-center">{icon}</span> : null}
      {children}
    </button>
  )
})

// ---------------------------------------------------------------------------
// IconButton
// ---------------------------------------------------------------------------

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode
  /** Required — icon-only controls must always expose an accessible name. */
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center',
        'rounded-[var(--hub-radius-md)] text-[var(--hub-text-secondary)] transition-colors',
        'hover:bg-[var(--hub-bg-hover)] hover:text-[var(--hub-text-primary)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        focusRing,
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
})

// ---------------------------------------------------------------------------
// Input / Select / Textarea
// ---------------------------------------------------------------------------

const controlBase = cx(
  'w-full rounded-[var(--hub-radius-md)] border border-[var(--hub-border-subtle)]',
  'bg-[var(--hub-bg-elevated)] text-[var(--hub-text-primary)]',
  'text-[length:var(--hub-body-size)] leading-[var(--hub-body-line)]',
  'placeholder:text-[var(--hub-text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--hub-accent)] focus:border-[var(--hub-accent)]',
  'disabled:cursor-not-allowed disabled:opacity-40',
)

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cx(controlBase, 'h-[var(--hub-size-input)] px-[var(--hub-space-3)]', className)}
      {...rest}
    />
  )
})

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cx(controlBase, 'h-[var(--hub-size-input)] px-[var(--hub-space-3)]', className)}
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
        'min-h-[var(--hub-size-composer-min)] px-[var(--hub-space-3)] py-[var(--hub-space-2)]',
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
  /** Presence enables the removable variant and renders an × affordance. */
  onRemove?: () => void
  /** Accessible label for the remove button. Defaults to "Xoá". */
  removeLabel?: string
  className?: string
}

export function Chip({ children, onRemove, removeLabel = 'Xoá', className }: ChipProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[var(--hub-space-1)] rounded-[var(--hub-radius-full)]',
        'border border-[var(--hub-border-subtle)] bg-[var(--hub-bg-elevated)]',
        'px-[var(--hub-space-3)] py-[3px] text-[length:var(--hub-caption-size)] text-[var(--hub-text-secondary)]',
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
            'ml-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full leading-none',
            'text-[var(--hub-text-muted)] hover:bg-[var(--hub-bg-hover)] hover:text-[var(--hub-text-primary)]',
            focusRing,
          )}
        >
          ×
        </button>
      ) : null}
    </span>
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
  ready: 'bg-[var(--hub-success)]',
  running: 'bg-[var(--hub-accent)]',
  paused: 'bg-[var(--hub-text-muted)]',
  'setup-required': 'bg-[var(--hub-warning)]',
  'not-installed': 'bg-[var(--hub-text-muted)]',
  'rate-limited': 'bg-[var(--hub-warning)]',
  error: 'bg-[var(--hub-error)]',
  offline: 'bg-[var(--hub-text-muted)]',
}

const statusLabels: Record<StatusKind, string> = {
  ready: 'Sẵn sàng',
  running: 'Đang chạy',
  paused: 'Tạm dừng',
  'setup-required': 'Cần cấu hình',
  'not-installed': 'Chưa cài',
  'rate-limited': 'Giới hạn tốc độ',
  error: 'Lỗi',
  offline: 'Ngoại tuyến',
}

export function Status({ kind, label, className }: StatusProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[6px] text-[length:var(--hub-caption-size)] text-[var(--hub-text-secondary)]',
        className,
      )}
    >
      <span aria-hidden="true" className={cx('h-2 w-2 shrink-0 rounded-full', statusDotClass[kind])} />
      {label ?? statusLabels[kind]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ProviderDot
// ---------------------------------------------------------------------------

export type ProviderId = 'claude' | 'codex' | 'nvidia' | 'gemini'

export type ProviderDotProps = {
  provider: ProviderId
  className?: string
}

// Reuses the existing --color-claude/codex/nvidia/gemini tokens from
// index.css's @theme block via their Tailwind bg-* utilities — provider
// colour usage is restricted to this 6-8px identity dot everywhere else.
const providerDotClass: Record<ProviderId, string> = {
  claude: 'bg-claude',
  codex: 'bg-codex',
  nvidia: 'bg-nvidia',
  gemini: 'bg-gemini',
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
        'flex flex-col items-center justify-center gap-[var(--hub-space-2)] text-center',
        'rounded-[var(--hub-radius-lg)] border border-dashed border-[var(--hub-border-subtle)]',
        'px-[var(--hub-space-4)] py-[var(--hub-space-8)]',
        className,
      )}
    >
      {icon ? <span aria-hidden="true" className="text-[var(--hub-text-muted)]">{icon}</span> : null}
      <h3 className="text-[length:var(--hub-label-size)] leading-[var(--hub-label-line)] font-semibold text-[var(--hub-text-primary)]">
        {title}
      </h3>
      {description ? (
        <p className="max-w-sm text-[length:var(--hub-caption-size)] leading-[var(--hub-caption-line)] text-[var(--hub-text-secondary)]">
          {description}
        </p>
      ) : null}
      {visibleActions.length > 0 ? (
        <div className="mt-[var(--hub-space-2)] flex flex-wrap justify-center gap-[var(--hub-space-2)]">
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
