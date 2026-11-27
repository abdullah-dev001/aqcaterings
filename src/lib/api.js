import { supabase } from './supabase.js'

/*
 * Read-only queries for the public site.
 * RLS hides invisible rows from visitors, but a logged-in admin can see
 * everything, so the public queries also filter on is_visible explicitly
 * (the site then looks the same for admins as for visitors).
 * Everything is ordered by sort_order (embedded items too).
 */

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

/** The single settings row (id = 1). Returns {} if it is missing. */
export async function getSettings() {
  const data = unwrap(await supabase.from('settings').select('*').eq('id', 1).maybeSingle())
  return data ?? {}
}

export async function getHeroSlides() {
  return unwrap(
    await supabase
      .from('hero_slides')
      .select('id, image_url, sort_order')
      .eq('is_visible', true)
      .order('sort_order'),
  )
}

/** Sections of one kind, with a light list of items (for counts and fallback covers). */
export async function getSections(kind) {
  return unwrap(
    await supabase
      .from('sections')
      .select('*, items(id, images, sort_order)')
      .eq('kind', kind)
      .eq('is_visible', true)
      .eq('items.is_visible', true)
      .order('sort_order')
      .order('sort_order', { referencedTable: 'items' }),
  )
}

/** One section by slug with all its items. Returns null if not found. */
export async function getSectionWithItems(slug, kind) {
  return unwrap(
    await supabase
      .from('sections')
      .select('*, items(*)')
      .eq('slug', slug)
      .eq('kind', kind)
      .eq('is_visible', true)
      .eq('items.is_visible', true)
      .order('sort_order', { referencedTable: 'items' })
      .maybeSingle(),
  )
}

/** All menu sections, each with its items. */
export async function getMenuWithItems() {
  return unwrap(
    await supabase
      .from('sections')
      .select('*, items(*)')
      .eq('kind', 'menu')
      .eq('is_visible', true)
      .eq('items.is_visible', true)
      .order('sort_order')
      .order('sort_order', { referencedTable: 'items' }),
  )
}

/** Featured dishes across visible menu sections, each with its section's name and slug. */
export async function getFeaturedDishes(limit = 4) {
  const data = unwrap(
    await supabase
      .from('items')
      .select('*, sections!inner(name, name_ur, slug, kind, is_visible)')
      .eq('is_featured', true)
      .eq('is_visible', true)
      .eq('sections.kind', 'menu')
      .eq('sections.is_visible', true)
      .order('sort_order')
      .limit(limit),
  )
  return data.map(({ sections, ...item }) => ({ ...item, section: sections }))
}
