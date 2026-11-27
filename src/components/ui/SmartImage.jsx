import { useEffect, useRef, useState } from 'react'
import { thumb as toThumb } from '../../lib/images.js'

/**
 * <img> that
 * - uses the small "-sm" copy when `small` is set, and falls back to the original once if it 404s
 * - fades in (opacity 0 → 1, 300ms) when loaded; give the parent a blush/plum background
 * - defaults to loading="lazy" + decoding="async"
 * Size it with className exactly like a normal <img>.
 */
export default function SmartImage({
  src,
  small = false,
  alt = '',
  className = '',
  loading = 'lazy',
  fetchPriority,
  onLoad,
  width,
  height,
  // Override when the image also animates something else (e.g. a hover zoom).
  transition = 'transition-opacity duration-300',
  ...rest
}) {
  const preferred = small ? toThumb(src) : src
  const [current, setCurrent] = useState(preferred)
  const [loaded, setLoaded] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)
  const ref = useRef(null)

  // New src → start again (adjusting state during render, as React recommends).
  if (src !== lastSrc) {
    setLastSrc(src)
    setCurrent(preferred)
    setLoaded(false)
  }

  // Images already in the browser cache may finish before React attaches onLoad.
  useEffect(() => {
    const img = ref.current
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [current])

  if (!src) return null

  return (
    <img
      ref={ref}
      src={current}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      width={width}
      height={height}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      onError={() => {
        if (current !== src) setCurrent(src) // -sm missing → original, once
      }}
      className={`${transition} ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      {...rest}
    />
  )
}
