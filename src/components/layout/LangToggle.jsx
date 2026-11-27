import { useLang } from '../../i18n/LanguageContext.jsx'

/** "EN | اردو" pill. Always laid out EN-first, whatever the page direction. */
export default function LangToggle({ className = '' }) {
  const { lang, setLang, t } = useLang()
  const seg = (active) =>
    `rounded-full px-3 py-1 transition-colors duration-200 ${
      active ? 'bg-plum text-cream' : 'text-plum hover:text-gold'
    }`

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      dir="ltr"
      className={`inline-flex items-center gap-0.5 rounded-full border border-[#E8C4D0] p-0.5 text-[12px] ${className}`}
    >
      <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')} className={seg(lang === 'en')}>
        EN
      </button>
      <button
        type="button"
        lang="ur"
        aria-pressed={lang === 'ur'}
        onClick={() => setLang('ur')}
        className={`${seg(lang === 'ur')} font-urdu leading-[1.9]`}
      >
        اردو
      </button>
    </div>
  )
}
