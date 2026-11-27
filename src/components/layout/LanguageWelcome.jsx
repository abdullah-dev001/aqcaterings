import { useEffect } from 'react'
import { useLang } from '../../i18n/LanguageContext.jsx'
import { useSettings } from '../../hooks/useSiteData.js'

/** First-visit language picker. Shown until a choice is saved in localStorage. */
export default function LanguageWelcome() {
  const { chosen, setLang } = useLang()
  const { data: settings } = useSettings()

  useEffect(() => {
    if (chosen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [chosen])

  if (chosen) return null

  const brandName = settings?.brand_name ?? ''
  const initial = /^[a-z]/i.test(brandName) ? brandName[0].toUpperCase() : 'B'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-welcome-title"
      className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-cream/85 p-5 backdrop-blur-sm"
    >
      <div className="w-full max-w-[400px] animate-pop rounded-[28px] bg-blush px-7 py-10 text-center sm:px-10">
        <div className="flex flex-col items-center gap-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full border-[1.5px] border-gold font-heading text-[28px] italic text-plum">
              {initial}
            </span>
          )}
          {brandName && <span className="font-heading text-[22px] font-semibold text-plum">{brandName}</span>}
        </div>

        <h2 id="lang-welcome-title" className="mt-6 font-heading text-[24px] font-medium leading-tight text-plum">
          Choose your language
        </h2>
        <p lang="ur" dir="rtl" className="mt-2 font-urdu text-[19px] leading-[2] text-plum-soft">
          اپنی زبان منتخب کریں
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            lang="en"
            onClick={() => setLang('en')}
            className="rounded-full bg-gold px-8 py-4 text-[16px] font-medium text-ink transition-colors duration-200 hover:bg-gold-hover"
          >
            English
          </button>
          <button
            type="button"
            lang="ur"
            onClick={() => setLang('ur')}
            className="rounded-full bg-plum px-8 py-3 font-urdu text-[18px] leading-[2] text-cream transition-colors duration-200 hover:bg-plum/90"
          >
            اردو
          </button>
        </div>
      </div>
    </div>
  )
}
