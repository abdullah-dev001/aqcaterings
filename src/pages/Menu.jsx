import { Link, useParams } from 'react-router-dom'
import DishCard, { DishCardSkeleton } from '../components/cards/DishCard.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import LoadError from '../components/ui/LoadError.jsx'
import NotFound from './NotFound.jsx'
import { useSettings, useMenuWithItems } from '../hooks/useSiteData.js'
import useScrollToHashWhenReady from '../hooks/useScrollToHashWhenReady.js'
import { buildWhatsAppTextLink } from '../lib/whatsapp.js'
import { useLang } from '../i18n/LanguageContext.jsx'

const pillBase =
  'rounded-full border-[1.5px] px-6 py-[11px] text-[14px] transition-all duration-200 hover:border-gold rtl:py-1.5'
const pillOn = 'border-plum bg-plum text-cream'
const pillOff = 'border-[#E8C4D0] bg-transparent text-plum'

/** Serves both /menu (all categories) and /menu/:slug (one category). */
export default function Menu() {
  const { slug } = useParams()
  const { t, tc, pick } = useLang()
  const { data: settings } = useSettings()
  const { data: sections, isLoading, isError, refetch } = useMenuWithItems()
  useScrollToHashWhenReady(Boolean(sections))

  const menuCategories = sections ?? []
  const active = slug ? menuCategories.find((c) => c.slug === slug) : null
  if (slug && sections && !active) return <NotFound />

  const groups = active ? [active] : slug ? [] : menuCategories
  const pills = [{ key: 'all', name: t('menu.all'), to: '/menu', on: !slug }].concat(
    menuCategories.map((c) => ({ key: c.id, name: pick(c, 'name'), to: `/menu/${c.slug}`, on: active?.slug === c.slug })),
  )

  return (
    <>
      {/* Banner */}
      <section className="mx-[2%] rounded-[28px] bg-blush px-6 pb-[72px] pt-16 text-center">
        <Link
          to="/"
          className="mb-[22px] inline-flex items-center gap-1.5 text-[13px] text-plum-soft transition-colors hover:text-gold"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rtl:rotate-180">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          {t('menu.back')}
        </Link>
        <p className="mb-2.5 text-[13px] uppercase tracking-[3px] text-[#9A7A10] rtl:text-[15px]">{t('menu.eyebrow')}</p>
        <h1 className="font-heading text-[34px] font-medium leading-[1.15] sm:text-[clamp(40px,5vw,60px)] rtl:text-[31px] sm:rtl:text-[clamp(36px,4.5vw,54px)]">
          {t('menu.titleStart')} <span className="italic text-gold">{t('menu.titleAccent')}</span>
        </h1>
        <p className="mx-auto mt-[18px] max-w-[540px] text-[16px] leading-[1.7] text-plum-soft">{t('menu.intro')}</p>
      </section>

      {/* Category pills */}
      <div className="mx-auto max-w-[1200px] px-6 pt-11">
        <nav aria-label={t('menu.categories')} className="flex flex-wrap justify-center gap-2.5">
          {pills.map((p) => (
            <Link
              key={p.key}
              to={p.to}
              state={{ preserveScroll: true }}
              aria-current={p.on ? 'page' : undefined}
              className={`${pillBase} ${p.on ? pillOn : pillOff}`}
            >
              {p.name}
            </Link>
          ))}
          {isLoading &&
            [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-[46px] w-28 rounded-full" />)}
        </nav>
      </div>

      {/* Category groups */}
      <div className="mx-auto max-w-[1200px] px-6 pb-[90px] pt-6">
        {isError && <LoadError onRetry={refetch} className="pt-[52px]" />}
        {isLoading && (
          <section className="pt-[52px]">
            <div className="mb-[26px] flex items-center gap-3.5">
              <Skeleton className="h-[42px] w-48 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <span className="h-px flex-1 bg-[#F0CBD6]" />
            </div>
            <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((k) => (
                <DishCardSkeleton key={k} />
              ))}
            </div>
          </section>
        )}
        {groups.map((g) => {
          const dishes = g.items ?? []
          const name = pick(g, 'name')
          return (
            <section key={g.id} className="pt-[52px]">
              <div className="mb-[26px] flex items-baseline gap-3.5">
                <h2 className="font-heading text-[28px] font-medium sm:text-[34px] rtl:text-[25px] sm:rtl:text-[31px]">{name}</h2>
                <span className="shrink-0 text-[13px] text-plum-soft">{tc('count.dishes', dishes.length)}</span>
                <span className="h-px flex-1 bg-[#F0CBD6]" />
              </div>
              <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
                {dishes.map((d) => (
                  <DishCard key={d.id} dish={d} categoryName={name} categorySlug={g.slug} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Build a menu just for you */}
      <section className="mx-[2%] mb-20 rounded-[32px] bg-plum px-6 py-[72px] text-center text-cream">
        <p className="mb-2.5 text-[13px] uppercase tracking-[3px] text-[#F3D27A] rtl:text-[15px]">{t('menu.customEyebrow')}</p>
        <h2 className="font-heading text-[30px] font-medium leading-[1.25] sm:text-[40px] rtl:text-[27px] sm:rtl:text-[36px]">
          {t('menu.customTitleStart')} <span className="italic text-[#F3D27A]">{t('menu.customTitleAccent')}</span>
        </h2>
        <p className="mx-auto mb-[30px] mt-4 max-w-[500px] text-[16px] leading-[1.7] text-blush">{t('menu.customText')}</p>
        <a
          href={buildWhatsAppTextLink(settings, t('menu.planMessage'))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 text-[15px] font-medium text-ink transition-[background] duration-200 hover:bg-gold-hover rtl:py-3"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
          </svg>
          {t('menu.planButton')}
        </a>
      </section>
    </>
  )
}
