export const DEFAULT_TEMPLATE = 'Assalam o Alaikum! I would like to book this: {title} ({section}). {link}'

/** Fills {title}, {section} and {link} in a message template. */
export function fillTemplate(template, title = '', section = '', link = '') {
  return (template || DEFAULT_TEMPLATE)
    .replaceAll('{title}', title)
    .replaceAll('{section}', section)
    .replaceAll('{link}', link)
    .replace(/\(\s*\)/g, '') // drop empty "()" if no section was given
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const numberOf = (settings) => String(settings?.whatsapp_number ?? '').replace(/\D/g, '')

/**
 * Builds a wa.me link with a free-form pre-filled message (no template).
 */
export function buildWhatsAppTextLink(settings, text) {
  return `https://wa.me/${numberOf(settings)}?text=${encodeURIComponent(text)}`
}

/**
 * Builds a wa.me link with a pre-filled message from settings.message_template.
 *
 * @param {object} settings      - settings row (whatsapp_number, message_template)
 * @param {object} [item]        - the event/dish being booked (uses .title)
 * @param {string} [sectionName] - e.g. "Walima" or "BBQ"
 * @param {string} [link]        - page URL to include in the message
 * @returns {string} https://wa.me/<number>?text=<encoded message>
 */
export function buildWhatsAppLink(settings, item, sectionName = '', link = '') {
  const number = numberOf(settings)

  // No item → a generic "chat with us" link without a template.
  if (!item) return `https://wa.me/${number}`

  const message = fillTemplate(settings?.message_template, item.title ?? item.name ?? '', sectionName, link)
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
