import { Loader2 } from 'lucide-react'

/* Small, consistent building blocks for the dashboard. */

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const btnVariants = {
  primary: 'bg-plum text-cream hover:bg-plum/90',
  secondary: 'border border-[#EBD3DA] bg-white text-plum hover:border-plum',
  danger: 'bg-[#B4232A] text-white hover:bg-[#9A1D23]',
  ghost: 'text-plum hover:bg-blush',
}

const btnSizes = {
  md: 'px-5 py-3 text-[15px]',
  sm: 'px-4 py-2 text-[14px]',
}

export function Btn({ variant = 'primary', size = 'md', loading = false, disabled = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      disabled={loading || disabled}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

/** Round icon-only button with an accessible label (also shown as tooltip). */
export function IconBtn({ label, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-plum transition-colors ' +
        'hover:bg-blush disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  )
}

/** On/off switch. */
export function Toggle({ checked, onChange, label, disabled = false, showLabel = true }) {
  return (
    <label className={`inline-flex select-none items-center gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={showLabel ? undefined : label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
          checked ? 'bg-plum' : 'bg-[#E3CCD4]'
        }`}
      >
        <span
          className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
      {showLabel && <span className="text-[14px] text-plum">{label}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border border-[#EBD3DA] bg-white px-4 py-3 text-base text-plum outline-none transition ' +
  'placeholder:text-plum-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/20'

/** Urdu inputs: right-to-left with the Nastaliq font. Use together with dir="rtl". */
export const urInputClass = `${inputClass} font-urdu leading-[2] py-2`

/** English field and its Urdu twin side by side (stacked on mobile). */
export function Pair({ children }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>
}

/** Small "UR" badge when Urdu is filled, soft hint when it isn't. */
export function UrBadge({ filled }) {
  return filled ? (
    <span className="ms-2 inline-block rounded-full bg-[#E9F3EA] px-2 py-0.5 align-middle text-[11px] font-medium text-[#2F6B3A]">UR</span>
  ) : (
    <span className="ms-2 inline-block align-middle text-[11px] italic text-plum-soft/70">Urdu missing</span>
  )
}

/** Label + control + optional hint. */
export function Field({ label, hint, htmlFor, optional = false, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-[14px] font-medium text-plum">
          {label}
          {optional && <span className="ml-1.5 font-normal text-plum-soft">(optional)</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[13px] leading-relaxed text-plum-soft">{hint}</p>}
    </div>
  )
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-3xl border border-[#F3D9E1] bg-white ${className}`} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-heading text-[28px] font-medium leading-tight text-plum sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-plum-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="font-heading text-[22px] text-plum">{title}</p>
      {text && <p className="max-w-sm text-[14px] text-plum-soft">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, k) => (
        <div key={k} className="h-[88px] animate-pulse rounded-3xl bg-blush" />
      ))}
    </div>
  )
}

export function Thumb({ src, className = '' }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className={`shrink-0 rounded-2xl object-cover ${className}`} />
  ) : (
    <div className={`shrink-0 rounded-2xl bg-blush ${className}`} />
  )
}
