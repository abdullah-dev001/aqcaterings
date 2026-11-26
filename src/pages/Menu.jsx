import { Link, useParams } from 'react-router-dom'
import DishCard, { DishCardSkeleton } from '../components/cards/DishCard.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import LoadError from '../components/ui/LoadError.jsx'
import NotFound from './NotFound.jsx'
import { useSettings, useMenuWithItems } from '../hooks/useSiteData.js'
import useScrollToHashWhenReady from '../hooks/useScrollToHashWhenReady.js'
import { buildWhatsAppTextLink } from '../lib/whatsapp.js'

const pillBase = 'rounded-full border-[1.5px] px-6 py-[11px] text-[14px] transition-all duration-200 hover:border-gold'
const pillOn = 'border-plum bg-plum text-cream'
const pillOff = 'border-[#E8C4D0] bg-transparent text-plum'

const planMessage =
  'Assalam o Alaikum! I would like to plan a custom menu for my event. Could you help me put one together?'

/** Serves both /menu (all categories) and /menu/:slug (one category). */
export default function Menu() {
  const { slug } = useParams()
  const { data: settings } = useSettings()
  const { data: sections, isLoading, isError, refetch } = useMenuWithItems()
  useScrollToHashWhenReady(Boolean(sections))

  const menuCategories = sections ?? []
  const active = slug ? menuCategories.find((c) => c.slug === slug) : null
  if (slug && sections && !active) return <NotFound />

  const groups = active ? [active] : slug ? [] : menuCategories
  const pills = [{ name: 'All', to: '/menu', on: !slug }].concat(
    menuCategories.map((c) => ({ name: c.name, to: `/menu/${c.slug}`, on: active?.slug === c.slug })),
  )

  return (
    <>
      {/* Banner */}
      <section className="mx-[2%] rounded-[28px] bg-blush px-6 pb-[72px] pt-16 text-center">
        <Link
          to="/"
          className="mb-[22px] inline-flex items-center gap-1.5 text-[13px] text-plum-soft transition-colors hover:text-gold"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to home
        </Link>
        <p className="mb-2.5 text-[13px] uppercase tracking-[3px] text-[#9A7A10]">Our kitchen</p>
        <h1 className="font-heading text-[34px] font-medium leading-[1.15] sm:text-[clamp(40px,5vw,60px)]">
          Food your guests <span className="italic text-gold">will remember</span>
        </h1>
        <p className="mx-auto mt-[18px] max-w-[540px] text-[16px] leading-[1.7] text-plum-soft">
          From smoky BBQ to royal desserts, every dish is cooked fresh for your event. Mix and match to build your
          perfect menu.
        </p>
      </section>

      {/* Category pills */}
      <div className="mx-auto max-w-[1200px] px-6 pt-11">
        <nav aria-label="Menu categories" className="flex flex-wrap justify-center gap-2.5">
          {pills.map((p) => (
            <Link
              key={p.name}
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
          return (
            <section key={g.id} className="pt-[52px]">
              <div className="mb-[26px] flex items-baseline gap-3.5">
                <h2 className="font-heading text-[28px] font-medium sm:text-[34px]">{g.name}</h2>
                <span className="shrink-0 text-[13px] text-plum-soft">
                  {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
                </span>
                <span className="h-px flex-1 bg-[#F0CBD6]" />
              </div>
              <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
                {dishes.map((d) => (
                  <DishCard key={d.id} dish={d} categoryName={g.name} categorySlug={g.slug} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Build a menu just for you */}
      <section className="mx-[2%] mb-20 rounded-[32px] bg-plum px-6 py-[72px] text-center text-cream">
        <p className="mb-2.5 text-[13px] uppercase tracking-[3px] text-[#F3D27A]">Custom menus</p>
        <h2 className="font-heading text-[30px] font-medium leading-[1.25] sm:text-[40px]">
          Build a menu <span className="italic text-[#F3D27A]">just for you</span>
        </h2>
        <p className="mx-auto mb-[30px] mt-4 max-w-[500px] text-[16px] leading-[1.7] text-blush">
          Tell us your guest count and favourite dishes, and we'll put together the perfect menu for your day.
        </p>
        <a
          href={buildWhatsAppTextLink(settings, planMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 text-[15px] font-medium text-ink transition-[background] duration-200 hover:bg-gold-hover"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
          </svg>
          Plan my menu
        </a>
      </section>
    </>
  )
}
