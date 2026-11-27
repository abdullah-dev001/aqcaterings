#!/usr/bin/env node
/**
 * One-time: create a small copy next to every image in the "media" bucket.
 *   media/<path>.webp  →  media/<path>-sm.webp   (max 800px wide, webp q70)
 *
 *   npm run make:thumbs
 *
 * Needs in .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_EMAIL, SEED_PASSWORD.
 *
 * Finding the files: the bucket is listed recursively. The storage policies have no
 * SELECT rule, so listing may come back empty for a normal login; every image URL
 * referenced in the database (hero_slides, items, sections, settings) is added too,
 * so everything the site actually shows is covered either way.
 *
 * Uploading: upsert needs SELECT as well, so each -sm file is uploaded with
 * upsert:false; "already exists" means it was made before and is counted as skipped.
 */
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'media'
const MARKER = `/storage/v1/object/public/${BUCKET}/`
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey, SEED_EMAIL: email, SEED_PASSWORD: password } = process.env
if (!url || !anonKey || !email || !password) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_EMAIL or SEED_PASSWORD in .env')
  process.exit(1)
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const unwrap = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}
const kb = (n) => `${Math.round(n / 1024)} KB`

/** Recursively list every file path in the bucket. */
async function listAll(prefix = '') {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, offset })
    if (error) throw new Error(`list ${prefix || '/'}: ${error.message}`)
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) out.push(...(await listAll(full))) // folder
      else out.push(full)
    }
    if (data.length < 1000) break
  }
  return out
}

/** Every storage path referenced by the database. */
async function referencedPaths() {
  const [hero, items, sections, settings] = await Promise.all([
    supabase.from('hero_slides').select('image_url'),
    supabase.from('items').select('images'),
    supabase.from('sections').select('cover_url'),
    supabase.from('settings').select('logo_url'),
  ]).then((rs) => rs.map((r, i) => unwrap(r, ['hero_slides', 'items', 'sections', 'settings'][i])))
  const urls = [
    ...hero.map((r) => r.image_url),
    ...items.flatMap((r) => r.images ?? []),
    ...sections.map((r) => r.cover_url),
    ...settings.map((r) => r.logo_url),
  ]
  return urls
    .filter((u) => typeof u === 'string' && u.includes(MARKER))
    .map((u) => decodeURIComponent(u.slice(u.indexOf(MARKER) + MARKER.length).split('?')[0]))
}

async function pool(items, size, fn) {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await fn(items[next++])
    }),
  )
}

async function main() {
  unwrap(await supabase.auth.signInWithPassword({ email, password }), 'sign in')
  console.log('✓ Signed in')

  let listed = []
  try {
    listed = await listAll()
  } catch (err) {
    console.warn(`! Could not list the bucket (${err.message})`)
  }
  const referenced = await referencedPaths()
  console.log(`  ${listed.length} files listed in the bucket, ${referenced.length} image URLs referenced in the database`)

  const all = new Set([...listed, ...referenced])
  const originals = [...all].filter((p) => p.endsWith('.webp') && !p.endsWith('-sm.webp')).sort()
  const skippedNonWebp = [...all].filter((p) => !p.endsWith('.webp'))
  console.log(`  ${originals.length} originals to process\n`)

  const stats = { created: 0, existed: 0, failed: [], before: 0, after: 0 }

  await pool(originals, 4, async (path) => {
    const smPath = path.replace(/\.webp$/, '-sm.webp')
    try {
      const res = await fetch(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
      if (!res.ok) throw new Error(`download ${res.status}`)
      const input = Buffer.from(await res.arrayBuffer())
      const small = await sharp(input).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer()

      const { error } = await supabase.storage.from(BUCKET).upload(smPath, small, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      })
      if (error && /already exists|duplicate/i.test(error.message)) {
        stats.existed++
        process.stdout.write('-')
        return
      }
      if (error) throw new Error(error.message)

      stats.created++
      stats.before += input.length
      stats.after += small.length
      process.stdout.write('.')
    } catch (err) {
      stats.failed.push(`${path}: ${err.message}`)
      process.stdout.write('x')
    }
  })

  console.log('\n')
  console.table({
    'originals found': originals.length,
    'thumbnails created': stats.created,
    'already had a thumbnail': stats.existed,
    failed: stats.failed.length,
    'avg original size': stats.created ? kb(stats.before / stats.created) : '—',
    'avg thumbnail size': stats.created ? kb(stats.after / stats.created) : '—',
  })
  if (skippedNonWebp.length) console.log(`Skipped ${skippedNonWebp.length} non-webp file(s).`)
  if (stats.failed.length) console.log('Failures:\n' + stats.failed.map((f) => `  - ${f}`).join('\n'))

  await supabase.auth.signOut()
  if (stats.failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error('\n✗', err.message)
  process.exit(1)
})
