/*
 * After a save, refresh both the admin lists and the public-site caches
 * so the website shows the change straight away.
 */

export function invalidateContent(qc) {
  for (const key of ['admin', 'sections', 'section', 'menu', 'featured_dishes']) {
    qc.invalidateQueries({ queryKey: [key] })
  }
}

export function invalidateHero(qc) {
  qc.invalidateQueries({ queryKey: ['admin', 'hero'] })
  qc.invalidateQueries({ queryKey: ['hero_slides'] })
}

export function invalidateSettings(qc) {
  qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
  qc.invalidateQueries({ queryKey: ['settings'] })
}
