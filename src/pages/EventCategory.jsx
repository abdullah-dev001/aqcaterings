import { Link, useParams } from 'react-router-dom'
import EventCard, { EventCardSkeleton } from '../components/cards/EventCard.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import LoadError from '../components/ui/LoadError.jsx'
import NotFound from './NotFound.jsx'
import { useSections, useSectionWithItems } from '../hooks/useSiteData.js'
import useScrollToHashWhenReady from '../hooks/useScrollToHashWhenReady.js'

const chip =
  'rounded-full border-[1.5px] px-[26px] py-3 text-[14px] transition-all duration-200 hover:border-plum hover:bg-plum hover:text-cream'

function AccentTitle({ title, accent }) {
  if (!accent || !title.includes(accent)) return title
  const [before, ...rest] = title.split(accent)
  return (
    <>
      {before}
      <span className="italic text-gold">{accent}</span>
      {rest.join(accent)}
    </>
  )
}

export default function EventCategory() {
  const { slug } = useParams()
  const { data: category, isLoading, isError, refetch } = useSectionWithItems(slug, 'event')
  const { data: allEvents } = useSections('event')
  useScrollToHashWhenReady(Boolean(category))

  if (!isLoading && !isError && !category) return <NotFound />

  const items = category?.items ?? []
  const others = (allEvents ?? []).filter((c) => c.slug !== slug)
  const count = items.length

  return (
    <>
      {/* Banner */}
      <section className="mx-[2%] rounded-[28px] bg-blush px-6 pb-[72px] pt-16 text-center">
        <Link
          to="/#events"
          className="mb-[22px] inline-flex items-center gap-1.5 text-[13px] text-plum-soft transition-colors hover:text-gold"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          All celebrations
        </Link>
        {category ? (
          <>
            <p className="mb-2.5 text-[13px] uppercase tracking-[3px] text-[#9A7A10]">
              {category.eyebrow || `${category.name} collection`}
            </p>
            <h1 className="font-heading text-[34px] font-medium leading-[1.15] sm:text-[clamp(40px,5vw,60px)]">
              <AccentTitle title={category.tagline || category.name} accent={category.tagline_accent} />
            </h1>
            {category.description && (
              <p className="mx-auto mt-[18px] max-w-[540px] text-[16px] leading-[1.7] text-plum-soft">
                {category.description}
              </p>
            )}
          </>
        ) : isError ? (
          <LoadError onRetry={refetch} className="pb-0" />
        ) : (
          <div className="flex flex-col items-center">
            <Skeleton tone="deep" className="mb-2.5 h-4 w-44 rounded-full" />
            <Skeleton tone="deep" className="h-[46px] w-[min(520px,90%)] rounded-full sm:h-[69px]" />
            <Skeleton tone="deep" className="mt-[18px] h-4 w-[min(540px,95%)] rounded-full" />
            <Skeleton tone="deep" className="mt-2.5 h-4 w-[min(380px,70%)] rounded-full" />
          </div>
        )}
      </section>

      {/* Events */}
      {!isError && (
        <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-[72px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            {isLoading ? (
              <Skeleton className="h-5 w-36 rounded-full" />
            ) : (
              <p className="text-[14px] text-plum-soft">
                Showing{' '}
                <span className="font-medium text-plum">
                  {count} {count === 1 ? 'setup' : 'setups'}
                </span>
              </p>
            )}
            <p className="text-[13px] text-plum-soft">Swipe the photos to see more</p>
          </div>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && [0, 1, 2].map((k) => <EventCardSkeleton key={k} />)}
            {items.map((event) => (
              <EventCard key={event.id} event={event} categoryName={category.name} categorySlug={category.slug} />
            ))}
          </div>
        </section>
      )}

      {/* Other celebrations */}
      <section className={`mx-auto max-w-[1000px] px-6 pb-[100px] text-center ${isError ? 'pt-[72px]' : ''}`}>
        <p className="mb-2.5 text-[13px] uppercase tracking-[3px] text-[#9A7A10]">Keep exploring</p>
        <h2 className="mb-7 font-heading text-[28px] font-medium sm:text-[34px]">Other celebrations</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {!allEvents && [0, 1, 2].map((k) => <Skeleton key={k} className="h-[48px] w-28 rounded-full" />)}
          {others.map((c) => (
            <Link key={c.id} to={`/events/${c.slug}`} className={`${chip} border-plum text-plum`}>
              {c.name}
            </Link>
          ))}
          <Link to="/menu" className={`${chip} border-gold bg-gold text-ink`}>
            See our menu
          </Link>
        </div>
      </section>
    </>
  )
}
