import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Skeleton from '../ui/Skeleton.jsx'
import SmartImage from '../ui/SmartImage.jsx'
import { useSettings } from '../../hooks/useSiteData.js'
import { buildWhatsAppLink } from '../../lib/whatsapp.js'
import { shareLink } from '../../lib/shareLink.js'
import { useLang } from '../../i18n/LanguageContext.jsx'

const arrowClass =
  'absolute top-1/2 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none ' +
  'bg-[rgba(255,248,243,.92)] text-plum opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100 md:flex'

/** Same footprint as EventCard, for loading states. */
export function EventCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[26px] border border-[#F3D9E1] bg-white p-3">
      <Skeleton className="h-[300px] rounded-[18px]" />
      <div className="flex flex-col px-2.5 pb-2 pt-[18px]">
        <Skeleton className="h-7 w-48 rounded-full" />
        <Skeleton className="mt-3 h-4 w-full rounded-full" />
        <Skeleton className="mb-5 mt-2 h-4 w-2/3 rounded-full" />
        <Skeleton className="h-[49px] rounded-full" />
      </div>
    </div>
  )
}

/** categoryName should already be in the active language (pick(section, 'name')). */
export default function EventCard({ event, categoryName, categorySlug }) {
  const { data: settings } = useSettings()
  const { t, pick, isUr } = useLang()
  const images = event.images ?? []
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: isUr ? 'rtl' : 'ltr' })
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    return () => emblaApi.off('select', onSelect).off('reInit', onSelect)
  }, [emblaApi])

  // Photos to render: every one already shown, plus the next one (preloaded lazily).
  // Grows as the visitor swipes; photos never shown are never downloaded.
  const [wanted, setWanted] = useState(() => new Set([0, 1]))
  useEffect(() => {
    if (images.length < 2) return
    const nextIdx = (selected + 1) % images.length
    setWanted((w) => (w.has(selected) && w.has(nextIdx) ? w : new Set([...w, selected, nextIdx])))
  }, [selected, images.length])

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const title = pick(event, 'title')
  const details = pick(event, 'details')
  const price = pick(event, 'price')
  const link = shareLink('e', categorySlug, event.slug)
  const bookHref = buildWhatsAppLink(
    { ...settings, message_template: pick(settings, 'message_template') },
    { title },
    categoryName,
    link,
  )

  return (
    <article
      id={event.slug}
      className="group flex scroll-mt-6 flex-col rounded-[26px] border border-[#F3D9E1] bg-white p-3 transition-transform duration-300 ease-[ease] hover:-translate-y-1"
    >
      <div className="relative h-[300px] overflow-hidden rounded-[18px] bg-blush">
        {images.length === 1 ? (
          <SmartImage small src={images[0]} alt={title} width={800} height={600} className="size-full object-cover" />
        ) : images.length > 1 ? (
          <div ref={emblaRef} className="h-full overflow-hidden">
            <div className="flex h-full touch-pan-y">
              {images.map((src, j) => (
                <div key={`${src}-${j}`} className="h-full min-w-0 flex-[0_0_100%]">
                  {/* Only photos the visitor has reached (plus the next one) are requested. */}
                  {wanted.has(j) && (
                    <SmartImage
                      small
                      src={src}
                      alt={t('card.photoOf', { title, n: j + 1, total: images.length })}
                      loading={j === selected ? 'eager' : 'lazy'}
                      width={800}
                      height={600}
                      draggable="false"
                      className="size-full select-none object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {price && (
          <span className="absolute start-3.5 top-3.5 rounded-full bg-[rgba(255,248,243,.95)] px-3 py-1.5 text-[12px] font-medium text-plum rtl:py-0.5">
            {price}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button type="button" aria-label={t('card.prev')} onClick={prev} className={`${arrowClass} start-2.5`}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rtl:rotate-180">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" aria-label={t('card.next')} onClick={next} className={`${arrowClass} end-2.5`}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rtl:rotate-180">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((src, j) => (
                <span
                  key={`${src}-${j}`}
                  className="h-1.5 rounded-[3px] transition-all duration-[400ms]"
                  style={{
                    width: j === selected ? 22 : 6,
                    background: j === selected ? '#C9A227' : 'rgba(255,248,243,.9)',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-[18px]">
        <h3 className="font-heading text-[23px] font-medium rtl:text-[21px]">{title}</h3>
        {details && (
          <p className="mb-5 mt-2 flex-1 whitespace-pre-line text-[14px] leading-[1.7] text-plum-soft">{details}</p>
        )}
        <a
          href={bookHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 rounded-full bg-plum p-3.5 text-[14px] font-medium text-cream transition-all duration-200 hover:bg-gold hover:text-ink rtl:py-2.5"
        >
          <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
          </svg>
          {pick(settings, 'event_button_text') || t('card.book')}
        </a>
      </div>
    </article>
  )
}
