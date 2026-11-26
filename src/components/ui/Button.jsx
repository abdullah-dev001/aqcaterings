import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium ' +
  'transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream ' +
  'disabled:pointer-events-none disabled:opacity-50'

const variants = {
  gold: 'bg-gold text-ink hover:bg-gold-hover',
  plum: 'bg-plum text-cream hover:bg-plum/90',
  outline: 'border border-plum text-plum hover:bg-plum hover:text-cream',
}

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: '',
  lg: 'px-8 py-4 text-base',
}

/**
 * Pill button. Renders a router <Link> when `to` is set, an <a> when `href`
 * is set, otherwise a <button>.
 */
export default function Button({
  variant = 'gold',
  size = 'md',
  to,
  href,
  className = '',
  children,
  ...props
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    const external = /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        className={classes}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
