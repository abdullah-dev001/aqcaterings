import { Link } from 'react-router-dom'
import { Heart, Mail, MapPin, Phone } from 'lucide-react'
import Skeleton from '../ui/Skeleton.jsx'
import { useSettings, useSections } from '../../hooks/useSiteData.js'
import { buildWhatsAppLink } from '../../lib/whatsapp.js'
import { useLang } from '../../i18n/LanguageContext.jsx'
import SmartImage from '../ui/SmartImage.jsx'

/* WhatsApp speech-bubble icon for the button (lucide has no brand logos). */
const WhatsAppIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
  </svg>
)

const heading = 'mb-5 text-[12px] uppercase tracking-[3px] text-gold rtl:mb-3 rtl:text-[15px]'
// Slides 4px toward the reading direction on hover.
const linkClass =
  'inline-block text-[14px] text-blush transition-all duration-200 hover:translate-x-1 hover:text-gold rtl:hover:-translate-x-1'

function ContactRow({ icon: Icon, href, children }) {
  const content = (
    <>
      <Icon className="mt-0.5 size-[18px] shrink-0 text-gold rtl:mt-1.5" />
      <span className="break-words">{children}</span>
    </>
  )
  const cls = 'flex items-start gap-3 text-[14px] leading-[1.6] text-blush'
  return href ? (
    <a href={href} className={`${cls} transition-colors duration-200 hover:text-gold`}>
      {content}
    </a>
  ) : (
    <p className={cls}>{content}</p>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const { t, pick } = useLang()
  const { data: settings, isLoading } = useSettings()
  const { data: events } = useSections('event')

  const englishName = settings?.brand_name ?? ''
  const brandName = pick(settings, 'brand_name')
  const initial = /^[a-z]/i.test(englishName) ? englishName[0].toUpperCase() : 'B'
  const waDigits = String(settings?.whatsapp_number ?? '').replace(/\D/g, '')
  const waLink = buildWhatsAppLink(settings)
  const place = [pick(settings, 'address'), pick(settings, 'city')].filter(Boolean).join('، ')
  const about = pick(settings, 'footer_about')

  // Plain text links under the about text (no icon circles).
  const socialLinks = [
    settings?.instagram_url && { href: settings.instagram_url, label: 'Instagram' },
    settings?.facebook_url && { href: settings.facebook_url, label: 'Facebook' },
  ].filter(Boolean)

  return (
    <footer id="contact" className="scroll-mt-4 rounded-t-[40px] bg-plum pb-8 pt-20 text-blush">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.3fr]">
          {/* Brand */}
          <div className="flex flex-col">
            {isLoading ? (
              <Skeleton className="h-10 w-48 rounded-full opacity-20" />
            ) : (
              <Link to="/" className="flex items-center gap-3">
                {settings?.logo_url ? (
                  <SmartImage small src={settings.logo_url} width={44} height={44} className="size-11 rounded-full object-cover" />
                ) : (
                  <span className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-gold font-heading text-[20px] italic text-cream">
                    {initial}
                  </span>
                )}
                <span className="font-heading text-[24px] text-cream rtl:text-[22px]">{brandName}</span>
              </Link>
            )}
            {about && (
              <p className="mt-5 max-w-[320px] whitespace-pre-line text-[14px] leading-[1.7] text-blush">{about}</p>
            )}
            {socialLinks.length > 0 && (
              <p className="mt-4 text-[13px] text-blush" dir="ltr">
                {socialLinks.map(({ href, label }, i) => (
                  <span key={label}>
                    {i > 0 && <span className="mx-2 opacity-60">·</span>}
                    <a href={href} target="_blank" rel="noopener noreferrer" className="transition-colors duration-200 hover:text-gold">
                      {label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Events */}
          <div>
            <p className={heading}>{t('footer.events')}</p>
            <ul className="flex flex-col gap-3">
              {events?.map((s) => (
                <li key={s.id}>
                  <Link to={`/events/${s.slug}`} className={linkClass}>
                    {pick(s, 'name')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <p className={heading}>{t('footer.explore')}</p>
            <ul className="flex flex-col gap-3">
              {[
                ['footer.home', '/'],
                ['footer.fullMenu', '/menu'],
                ['footer.how', '/#how'],
                ['footer.contact', '/#contact'],
              ].map(([key, to]) => (
                <li key={key}>
                  <Link to={to} className={linkClass}>
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in touch */}
          <div>
            <p className={heading}>{t('footer.getInTouch')}</p>
            <div className="flex flex-col gap-3.5">
              {settings?.phone && (
                <ContactRow icon={Phone} href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>
                  <span dir="ltr">{settings.phone}</span>
                </ContactRow>
              )}
              {settings?.email && (
                <ContactRow icon={Mail} href={`mailto:${settings.email}`}>
                  <span dir="ltr">{settings.email}</span>
                </ContactRow>
              )}
              {place && <ContactRow icon={MapPin}>{place}</ContactRow>}
            </div>
            {waDigits && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-gold-hover rtl:py-2"
              >
                <WhatsAppIcon className="size-4" />
                {t('common.chatWhatsApp')}
              </a>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center gap-2 border-t border-[rgba(248,225,231,.15)] pt-6 text-center text-[13px] text-blush/80 sm:flex-row sm:justify-between sm:text-start">
          <p>{t('footer.rights', { year, brand: brandName }).replace(/\s+([.۔])/, '$1')}</p>
          <p className="inline-flex items-center gap-1.5">
            {t('footer.madeWith')}
            <Heart className="size-3.5 fill-gold text-gold" aria-hidden="true" />
          </p>
        </div>
      </div>
    </footer>
  )
}
