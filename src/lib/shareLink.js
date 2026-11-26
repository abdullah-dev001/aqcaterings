/**
 * Link put into WhatsApp messages for an event item ('e') or dish ('d').
 *
 * In production it points at /share/<e|d>/<slug>, a Vercel function that serves
 * link-preview tags (photo, title) and then redirects to the real page.
 * `npm run dev` has no serverless functions, so dev links go straight to the page.
 */
export function shareLink(type, sectionSlug, itemSlug) {
  const origin = window.location.origin
  if (import.meta.env.DEV) {
    return `${origin}/${type === 'e' ? 'events' : 'menu'}/${sectionSlug}#${itemSlug}`
  }
  return `${origin}/share/${type}/${itemSlug}`
}
