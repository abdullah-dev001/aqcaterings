import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'
import en from './en.js'
import ur from './ur.js'

export const LANG_STORAGE_KEY = 'aq_lang'
const dictionaries = { en, ur }

function readStoredLang() {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY)
    return v === 'en' || v === 'ur' ? v : null
  } catch {
    return null
  }
}

/** Builds t / tc / pick for one language. */
function makeApi(lang) {
  const dict = dictionaries[lang] ?? en

  /** Static UI text: t('hero.title') or t('events.collection', { name }). */
  const t = (key, vars) => {
    let s = dict[key] ?? en[key] ?? key
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m))
    return s
  }

  /** Counted text: tc('count.setups', 3) → "3 setups". */
  const tc = (key, count) => t(`${key}_${count === 1 ? 'one' : 'other'}`, { count })

  /** Dynamic text from Supabase: field_ur in Urdu (if filled), otherwise the English field. */
  const pick = (obj, field) => {
    if (!obj) return ''
    if (lang === 'ur') {
      const v = obj[`${field}_ur`]
      if (typeof v === 'string' && v.trim()) return v
    }
    return obj[field] ?? ''
  }

  return { lang, isUr: lang === 'ur', t, tc, pick }
}

// Default (outside the provider, e.g. the dashboard) is English.
const LanguageContext = createContext({ ...makeApi('en'), chosen: true, setLang: () => {} })

export function LanguageProvider({ children }) {
  const [stored, setStored] = useState(readStoredLang)
  const lang = stored ?? 'en'

  // <html lang dir> drive the Urdu font + RTL layout (see index.css).
  useLayoutEffect(() => {
    const html = document.documentElement
    html.lang = lang
    html.dir = lang === 'ur' ? 'rtl' : 'ltr'
    return () => {
      html.lang = 'en'
      html.dir = 'ltr'
    }
  }, [lang])

  const setLang = useCallback((next) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      /* private mode: still switch for this visit */
    }
    setStored(next)
  }, [])

  const value = useMemo(() => ({ ...makeApi(lang), chosen: stored !== null, setLang }), [lang, stored, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLang = () => useContext(LanguageContext)
