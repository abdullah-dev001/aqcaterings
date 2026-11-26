import { supabase } from '../../lib/supabase.js'
import { removeFiles } from './storage.js'

/*
 * Admin reads + writes. RLS lets logged-in users see and change every row,
 * so these return hidden rows too.
 */

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

export const adminKeys = {
  sections: (kind) => ['admin', 'sections', kind],
  section: (id) => ['admin', 'section', String(id)],
  items: (sectionId) => ['admin', 'items', String(sectionId)],
  hero: ['admin', 'hero'],
  settings: ['admin', 'settings'],
}

/* ----------------------------- Reads ----------------------------- */

export async function listSections(kind) {
  return unwrap(
    await supabase
      .from('sections')
      .select('*, items(id, images, sort_order)')
      .eq('kind', kind)
      .order('sort_order')
      .order('id')
      .order('sort_order', { referencedTable: 'items' }),
  )
}

export async function getSection(id) {
  return unwrap(await supabase.from('sections').select('*').eq('id', id).maybeSingle())
}

export async function listItems(sectionId) {
  return unwrap(
    await supabase.from('items').select('*').eq('section_id', sectionId).order('sort_order').order('id'),
  )
}

export async function listHeroSlides() {
  return unwrap(await supabase.from('hero_slides').select('*').order('sort_order').order('id'))
}

export async function getSettingsRow() {
  return unwrap(await supabase.from('settings').select('*').eq('id', 1).maybeSingle()) ?? {}
}

/* ----------------------------- Helpers ----------------------------- */

/** Returns `base`, or `base-2`, `base-3`... if a row in `table` already uses it. */
export async function uniqueSlug(table, base, excludeId) {
  const rows = unwrap(await supabase.from(table).select('id, slug').like('slug', `${base}%`))
  const taken = new Set(rows.filter((r) => String(r.id) !== String(excludeId)).map((r) => r.slug))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export const nextSortOrder = (rows = []) =>
  rows.reduce((max, r) => Math.max(max, r.sort_order ?? 0), -1) + 1

/** Writes sort_order = index for every row whose position changed. */
export async function saveOrder(table, rows) {
  const updates = rows
    .map((r, i) => (r.sort_order === i ? null : supabase.from(table).update({ sort_order: i }).eq('id', r.id)))
    .filter(Boolean)
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed) throw failed.error
}

export async function updateRow(table, id, patch) {
  return unwrap(await supabase.from(table).update(patch).eq('id', id).select().single())
}

export async function insertRow(table, values) {
  return unwrap(await supabase.from(table).insert(values).select().single())
}

/* ----------------------------- Deletes ----------------------------- */

export async function deleteSection(section) {
  const items = unwrap(await supabase.from('items').select('id, images').eq('section_id', section.id))
  if (items.length) unwrap(await supabase.from('items').delete().eq('section_id', section.id))
  unwrap(await supabase.from('sections').delete().eq('id', section.id))
  removeFiles([section.cover_url, ...items.flatMap((i) => i.images ?? [])])
}

export async function deleteItem(item) {
  unwrap(await supabase.from('items').delete().eq('id', item.id))
  removeFiles(item.images ?? [])
}

export async function deleteHeroSlide(slide) {
  unwrap(await supabase.from('hero_slides').delete().eq('id', slide.id))
  removeFiles([slide.image_url])
}

export async function saveSettings(values) {
  return unwrap(await supabase.from('settings').upsert({ id: 1, ...values }).select().single())
}
