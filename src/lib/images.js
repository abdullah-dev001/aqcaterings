/**
 * Every uploaded image at media/<path>.webp has a small copy at media/<path>-sm.webp
 * (max 800px wide, webp q70). Cards and thumbnails use the small one.
 */

const STORAGE_MARKER = '/storage/v1/object/public/'

/** ".../x.webp" → ".../x-sm.webp". Other URLs (or already-small ones) are returned unchanged. */
export function thumb(url) {
  if (typeof url !== 'string' || !url.includes(STORAGE_MARKER)) return url
  if (/-sm\.webp(\?|$)/.test(url)) return url
  return url.replace(/\.webp(\?.*)?$/, '-sm.webp$1')
}

/** ".../x-sm.webp" → ".../x.webp" (used when cleaning up storage). */
export function fullFromThumb(url) {
  return typeof url === 'string' ? url.replace(/-sm\.webp(\?.*)?$/, '.webp$1') : url
}
