import Skeleton from '../ui/Skeleton.jsx'
import SmartImage from '../ui/SmartImage.jsx'
import { useSettings } from '../../hooks/useSiteData.js'
import { buildWhatsAppLink } from '../../lib/whatsapp.js'
import { shareLink } from '../../lib/shareLink.js'
import { useLang } from '../../i18n/LanguageContext.jsx'

/** Same footprint as DishCard, for loading states. */
export function DishCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[22px] border border-[#F3D9E1] bg-white p-2.5">
      <Skeleton className="h-[200px] rounded-[16px]" />
      <div className="flex flex-col px-2 pb-1.5 pt-3.5">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="mb-4 mt-2.5 h-4 w-full rounded-full" />
        <Skeleton className="h-[43px] rounded-full" />
      </div>
    </div>
  )
}

/** categoryName should already be in the active language (pick(section, 'name')). */
export default function DishCard({ dish, categoryName, categorySlug }) {
  const { data: settings } = useSettings()
  const { t, pick } = useLang()
  const image = dish.images?.[0]
  const title = pick(dish, 'title')
  const price = pick(dish, 'price')
  const link = shareLink('d', categorySlug, dish.slug)
  const askHref = buildWhatsAppLink(
    { ...settings, message_template: pick(settings, 'message_template') },
    { title },
    categoryName,
    link,
  )

  return (
    <article
      id={dish.slug}
      className="group flex scroll-mt-6 flex-col rounded-[22px] border border-[#F3D9E1] bg-white p-2.5 transition-transform duration-300 ease-[ease] hover:-translate-y-1"
    >
      <div className="relative h-[200px] overflow-hidden rounded-[16px] bg-blush">
        {image && (
          <SmartImage
            small
            src={image}
            alt={title}
            width={800}
            height={600}
            transition="transition-[opacity,transform] duration-[300ms,600ms] ease-[ease]"
            className="absolute inset-0 size-full object-cover group-hover:scale-105"
          />
        )}
        {price && (
          <span className="absolute start-3 top-3 rounded-full bg-[rgba(255,248,243,.95)] px-[11px] py-[5px] text-[11px] font-medium text-plum rtl:py-0.5">
            {price}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5">
        <h3 className="font-heading text-[20px] font-medium rtl:text-[18px]">{title}</h3>
        <p className="mb-4 mt-1.5 flex-1 whitespace-pre-line text-[13px] leading-[1.6] text-plum-soft">
          {pick(dish, 'details')}
        </p>
        <a
          href={askHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-[7px] rounded-full border-[1.5px] border-plum p-2.5 text-[13px] font-medium text-plum transition-all duration-200 hover:bg-plum hover:text-cream rtl:py-1.5"
        >
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
          </svg>
          {pick(settings, 'dish_button_text') || t('card.addDish')}
        </a>
      </div>
    </article>
  )
}
