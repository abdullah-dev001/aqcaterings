#!/usr/bin/env node
/**
 * One-time image seeding: uploads ./seed-images to Supabase Storage and links
 * them to EXISTING rows. It never creates or edits text rows.
 *
 *   npm run seed:images
 *
 * Needs in .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_EMAIL, SEED_PASSWORD
 * (an admin login, so storage + table RLS allow the writes).
 *
 * File names:
 *   hero-N.jpg                    → hero_slides (all existing slides replaced), sort_order = N
 *   dish-<itemSlug>.jpg           → items.images = [url] for that menu item
 *   <sectionSlug>-<itemSlug>-N.jpg → items.images = [urls sorted by N] for that event item
 * Then each event section's cover_url = first image of its first item (by sort_order).
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const DIR = path.resolve('seed-images')
const BUCKET = 'media'
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const EVENT_SECTIONS = ['qawwali-night', 'walima', 'mehndi', 'barat'] // longest first for prefix matching

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey, SEED_EMAIL: email, SEED_PASSWORD: password } = process.env
if (!url || !anonKey || !email || !password) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SEED_EMAIL or SEED_PASSWORD in .env')
  process.exit(1)
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const report = [] // { file, matchedTo, status }
const log = (file, matchedTo, status) => report.push({ file, 'matched to': matchedTo, status })

function unwrap({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

/** Works out what a file is for, from its name. */
function classify(file) {
  const base = path.parse(file).name.toLowerCase()
  let m
  if ((m = base.match(/^hero-(\d+)$/))) return { type: 'hero', n: Number(m[1]) }
  if ((m = base.match(/^dish-(.+)$/))) return { type: 'dish', itemSlug: m[1] }
  for (const section of EVENT_SECTIONS) {
    if (base.startsWith(`${section}-`) && (m = base.slice(section.length + 1).match(/^(.+)-(\d+)$/))) {
      return { type: 'event', sectionSlug: section, itemSlug: m[1], n: Number(m[2]) }
    }
  }
  return { type: 'unknown' }
}

/**
 * Compress to webp (max 1600px wide, q80) and upload to media/seed/<name>.webp.
 * Not using upsert: the storage policies have INSERT/UPDATE/DELETE but no SELECT,
 * and upsert needs SELECT, so it is rejected by RLS. If the file is already there
 * (a re-run), the existing copy is reused.
 */
async function upload(file) {
  const input = await readFile(path.join(DIR, file))
  const webp = await sharp(input).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
  const objectPath = `seed/${path.parse(file).name}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, webp, {
    contentType: 'image/webp',
    upsert: false,
    cacheControl: '31536000',
  })
  if (error && !/already exists|duplicate/i.test(error.message)) throw new Error(`upload ${file}: ${error.message}`)
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl
}

/** Runs fn over items with limited concurrency. */
async function pool(items, size, fn) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await fn(items[i], i)
      }
    }),
  )
  return results
}

async function main() {
  // 1. Sign in as admin.
  unwrap(await supabase.auth.signInWithPassword({ email, password }), 'sign in')
  console.log('✓ Signed in\n')

  // 2. Read files and existing rows.
  const files = (await readdir(DIR)).filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase())).sort()
  const items = unwrap(
    await supabase.from('items').select('id, slug, title, sort_order, images, section_id, sections(slug, kind)'),
    'load items',
  )
  const findItem = (slug, pred) => items.find((it) => it.slug === slug && pred(it.sections))

  // 3. Match every file to a target before uploading anything.
  const hero = [] // { file, n }
  const dishes = [] // { file, item }
  const eventGroups = new Map() // itemId → { item, label, files: [{file, n}] }

  for (const file of files) {
    const c = classify(file)
    if (c.type === 'hero') {
      hero.push({ file, n: c.n })
    } else if (c.type === 'dish') {
      const item = findItem(c.itemSlug, (s) => s?.kind === 'menu')
      if (item) dishes.push({ file, item })
      else log(file, `dish "${c.itemSlug}"`, 'NO MATCH: no menu item with that slug')
    } else if (c.type === 'event') {
      const item = findItem(c.itemSlug, (s) => s?.slug === c.sectionSlug && s?.kind === 'event')
      if (!item) {
        log(file, `${c.sectionSlug} / ${c.itemSlug}`, 'NO MATCH: no item with that slug in that section')
        continue
      }
      const g = eventGroups.get(item.id) ?? { item, label: `${c.sectionSlug} / ${item.slug}`, files: [] }
      g.files.push({ file, n: c.n })
      eventGroups.set(item.id, g)
    } else {
      log(file, '—', 'NO MATCH: unrecognised file name')
    }
  }

  // 4. Upload everything that matched.
  const toUpload = [...hero.map((h) => h.file), ...dishes.map((d) => d.file), ...[...eventGroups.values()].flatMap((g) => g.files.map((f) => f.file))]
  console.log(`Uploading ${toUpload.length} images…`)
  const urls = new Map()
  await pool(toUpload, 4, async (file) => {
    try {
      urls.set(file, await upload(file))
      process.stdout.write('.')
    } catch (err) {
      urls.set(file, null)
      log(file, '—', `UPLOAD FAILED: ${err.message}`)
      process.stdout.write('x')
    }
  })
  console.log('\n')

  // 5a. Hero slides: replace all.
  const heroOk = hero.filter((h) => urls.get(h.file)).sort((a, b) => a.n - b.n)
  if (heroOk.length) {
    unwrap(await supabase.from('hero_slides').delete().not('id', 'is', null), 'clear hero_slides')
    unwrap(
      await supabase
        .from('hero_slides')
        .insert(heroOk.map((h) => ({ image_url: urls.get(h.file), sort_order: h.n, is_visible: true }))),
      'insert hero_slides',
    )
    heroOk.forEach((h) => log(h.file, `hero slide #${h.n}`, 'ok'))
  }

  // 5b. Dishes: one image each.
  for (const { file, item } of dishes) {
    const u = urls.get(file)
    if (!u) continue
    try {
      unwrap(await supabase.from('items').update({ images: [u] }).eq('id', item.id), `update ${item.slug}`)
      item.images = [u]
      log(file, `dish "${item.title}"`, 'ok')
    } catch (err) {
      log(file, `dish "${item.title}"`, `DB FAILED: ${err.message}`)
    }
  }

  // 5c. Event items: all photos, ordered by N.
  for (const g of eventGroups.values()) {
    const ordered = g.files.sort((a, b) => a.n - b.n).filter((f) => urls.get(f.file))
    if (!ordered.length) continue
    const list = ordered.map((f) => urls.get(f.file))
    try {
      unwrap(await supabase.from('items').update({ images: list }).eq('id', g.item.id), `update ${g.item.slug}`)
      g.item.images = list
      ordered.forEach((f) => log(f.file, `${g.label} (photo ${f.n})`, 'ok'))
    } catch (err) {
      ordered.forEach((f) => log(f.file, g.label, `DB FAILED: ${err.message}`))
    }
  }

  // 6. Event section covers = first image of first item (by sort_order) that has photos.
  //    Only for sections where this run linked photos, so a failed run changes nothing.
  const touched = new Set([...eventGroups.values()].filter((g) => g.files.some((f) => urls.get(f.file))).map((g) => g.item.section_id))
  const sections = unwrap(await supabase.from('sections').select('id, slug, name').eq('kind', 'event'), 'load sections')
  const covers = []
  for (const s of sections) {
    if (!touched.has(s.id)) {
      covers.push({ section: s.slug, cover: '—', status: 'skipped: no photos linked this run' })
      continue
    }
    const first = items
      .filter((it) => it.section_id === s.id && it.images?.length)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
    if (!first) {
      covers.push({ section: s.slug, cover: '—', status: 'skipped: no item has photos' })
      continue
    }
    try {
      unwrap(await supabase.from('sections').update({ cover_url: first.images[0] }).eq('id', s.id), `cover ${s.slug}`)
      covers.push({ section: s.slug, cover: `${first.slug} photo 1`, status: 'ok' })
    } catch (err) {
      covers.push({ section: s.slug, cover: first.slug, status: `FAILED: ${err.message}` })
    }
  }

  // 7. Report.
  report.sort((a, b) => a.file.localeCompare(b.file))
  console.log('Files')
  console.table(report)
  console.log('Event section covers')
  console.table(covers)

  const unmatched = report.filter((r) => r.status.startsWith('NO MATCH'))
  const failed = report.filter((r) => /FAILED/.test(r.status))
  const empty = items.filter((it) => !it.images?.length)

  console.log(`\n${report.filter((r) => r.status === 'ok').length} linked, ${unmatched.length} unmatched, ${failed.length} failed.`)
  if (unmatched.length) console.log('Unmatched files:\n' + unmatched.map((r) => `  - ${r.file}`).join('\n'))
  console.log(
    empty.length
      ? `Items with no images (${empty.length}):\n` + empty.map((it) => `  - ${it.sections?.slug ?? '?'} / ${it.slug}`).join('\n')
      : 'Every item now has at least one image.',
  )

  await supabase.auth.signOut()
  if (failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error('\n✗', err.message)
  process.exit(1)
})
