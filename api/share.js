/**
 * Link previews for WhatsApp / Instagram / Facebook / X.
 *
 *   /share/e/:slug  → event item   → redirects to /events/<section>#<slug>
 *   /share/d/:slug  → menu dish    → redirects to /menu/<section>#<slug>
 *
 * Crawlers read the Open Graph tags; real visitors are redirected immediately.
 * Uses the publishable (anon) key, so RLS still only exposes visible rows.
 */

const KINDS = {
  e: { kind: 'event', base: '/events/' },
  d: { kind: 'menu', base: '/menu/' },
}

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

async function rest(path) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

function redirectPage({ target, title, description, image, pageUrl, siteName }) {
  const t = escapeHtml(target)
  const meta = [
    ['og:type', 'website'],
    ['og:title', title],
    ['og:description', description],
    ['og:image', image],
    ['og:url', pageUrl],
    ['og:site_name', siteName],
  ]
    .filter(([, v]) => v)
    .map(([p, v]) => `<meta property="${p}" content="${escapeHtml(v)}">`)
    .join('\n')

  const twitter = [
    ['twitter:card', image ? 'summary_large_image' : 'summary'],
    ['twitter:title', title],
    ['twitter:description', description],
    ['twitter:image', image],
  ]
    .filter(([, v]) => v)
    .map(([n, v]) => `<meta name="${n}" content="${escapeHtml(v)}">`)
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || siteName || 'Catering & Decor')}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
${meta}
${twitter}
<link rel="canonical" href="${t}">
<meta http-equiv="refresh" content="0; url=${t}">
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body style="font-family:sans-serif;background:#FFF8F3;color:#5B2A4A">
<p>Opening <a href="${t}">${escapeHtml(title || 'the page')}</a>…</p>
</body>
</html>`
}

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `${proto}://${host}`
  const { kind: k, slug } = req.query
  const config = KINDS[k]

  const send = (status, html) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
    res.end(html)
  }

  const home = () => send(200, redirectPage({ target: `${origin}/` }))

  if (!config || typeof slug !== 'string' || !/^[a-z0-9-]{1,120}$/i.test(slug)) return home()

  try {
    const select = 'title,slug,details,images,sections!inner(name,slug,kind,is_visible)'
    const params = new URLSearchParams({
      select,
      slug: `eq.${slug}`,
      is_visible: 'eq.true',
      'sections.kind': `eq.${config.kind}`,
      'sections.is_visible': 'eq.true',
      limit: '1',
    })

    const [items, settingsRows] = await Promise.all([
      rest(`items?${params}`),
      rest('settings?select=brand_name&id=eq.1').catch(() => []),
    ])

    const item = items[0]
    if (!item) return home()

    const section = item.sections
    const target = `${origin}${config.base}${encodeURIComponent(section.slug)}#${encodeURIComponent(item.slug)}`
    const details = (item.details || '').replace(/\s+/g, ' ').trim()
    const description = [section.name, details && truncate(details, 150)].filter(Boolean).join(' · ')
    let image = item.images?.[0] || null
    if (image && !/^https?:\/\//i.test(image)) image = new URL(image, origin).href

    return send(
      200,
      redirectPage({
        target,
        title: item.title,
        description,
        image,
        pageUrl: `${origin}/share/${k}/${item.slug}`,
        siteName: settingsRows?.[0]?.brand_name || undefined,
      }),
    )
  } catch (err) {
    console.error('share preview failed', err)
    return home()
  }
}
