import { Link } from 'react-router-dom'
import Hero from '../components/home/Hero.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import LoadError from '../components/ui/LoadError.jsx'
import { useSettings, useSections, useFeaturedDishes } from '../hooks/useSiteData.js'
import { buildWhatsAppLink } from '../lib/whatsapp.js'

const steps = [
  {
    n: '1',
    title: 'Pick a look',
    text: 'Browse our Walima, Mehndi, Barat and Qawwali setups and find the one you love.',
    icon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',
  },
  {
    n: '2',
    title: 'Tap Book this look',
    text: 'WhatsApp opens with the design already in the message. Just hit send.',
    icon: 'M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z',
  },
  {
    n: '3',
    title: 'We make it happen',
    text: 'We plan the decor and food with you, then bring it all to life on your big day.',
    icon: 'M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z',
  },
]

const eyebrow = 'mb-2.5 text-[13px] uppercase tracking-[3px]'
const h2 = 'font-heading text-[32px] font-medium leading-[1.2] sm:text-[44px]'

// Cover: section cover_url → first image of its first item → none (blush box).
const coverOf = (section) => section.cover_url || section.items?.[0]?.images?.[0] || null

export default function Home() {
  const { data: settings } = useSettings()
  const events = useSections('event')
  const featured = useFeaturedDishes(4)
  const whatsappLink = buildWhatsAppLink(settings)

  return (
    <>
      <Hero />

      {/* Pick your celebration */}
      <section id="events" className="mx-auto max-w-[1200px] scroll-mt-4 px-6 pb-[90px] pt-[80px] sm:pt-[110px]">
        <div className="mb-[52px] text-center">
          <p className={`${eyebrow} text-gold`}>Our events</p>
          <h2 className={h2}>Pick your celebration</h2>
        </div>
        {events.isError ? (
          <LoadError onRetry={events.refetch} />
        ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {events.isLoading &&
            [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-[380px] rounded-[24px]" />)}
          {events.data?.map((cat) => (
            <Link
              key={cat.id}
              to={`/events/${cat.slug}`}
              className="group relative block h-[380px] overflow-hidden rounded-[24px]"
            >
              {coverOf(cat) ? (
                <img
                  src={coverOf(cat)}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-[600ms] ease-[ease] group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-blush" />
              )}
              <div className="absolute inset-x-3.5 bottom-3.5 flex items-center justify-between rounded-[18px] bg-[rgba(255,248,243,.94)] px-5 py-[18px]">
                <div>
                  <h3 className="font-heading text-[24px] font-medium leading-tight text-plum">{cat.name}</h3>
                  <p className="mt-0.5 text-[12px] text-plum-soft">
                    {cat.items?.length ?? 0} {cat.items?.length === 1 ? 'setup' : 'setups'}
                  </p>
                </div>
                <span className="flex size-[38px] items-center justify-center rounded-full bg-plum text-cream">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1200px] px-6 pb-[80px] pt-5 sm:pb-[110px]">
        <div className="mb-14 text-center">
          <p className={`${eyebrow} text-[#9A7A10]`}>How it works</p>
          <h2 className={h2}>
            Your dream day in <span className="italic text-gold">3 simple steps</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-4 lg:gap-7">
          {steps.map((st) => (
            <div key={st.n} className="rounded-[28px] border border-[#F3D9E1] bg-white px-8 py-10 text-center sm:px-5 lg:px-8">
              <div className="relative mx-auto mb-[22px] flex size-[72px] items-center justify-center rounded-full bg-blush text-plum">
                <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={st.icon} />
                </svg>
                <span className="absolute -right-1 -top-1 flex size-[26px] items-center justify-center rounded-full bg-gold text-[12px] font-medium text-ink">
                  {st.n}
                </span>
              </div>
              <h3 className="mb-2.5 font-heading text-[24px] font-medium">{st.title}</h3>
              <p className="text-[14px] leading-[1.7] text-plum-soft">{st.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured dishes */}
      <section id="menu" className="mx-[2%] rounded-[40px] bg-blush px-6 py-[72px] sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-11 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className={`${eyebrow} text-[#9A7A10]`}>Our kitchen</p>
              <h2 className={h2}>Featured dishes</h2>
            </div>
            <Link
              to="/menu"
              className="rounded-full border-[1.5px] border-plum px-[26px] py-3 text-[14px] font-medium text-plum transition-colors hover:text-gold"
            >
              View full menu
            </Link>
          </div>
          {featured.isError ? (
            <LoadError onRetry={featured.refetch} />
          ) : (
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
            {featured.isLoading &&
              [0, 1, 2, 3].map((k) => (
                <div key={k} className="rounded-[22px] bg-cream p-3">
                  <Skeleton className="h-[200px] rounded-[16px]" />
                  <div className="px-2 pb-2 pt-3.5">
                    <Skeleton className="h-3 w-20 rounded-full" />
                    <Skeleton className="mt-2.5 h-6 w-36 rounded-full" />
                  </div>
                </div>
              ))}
            {featured.data?.map((d) => (
              <div key={d.id} className="rounded-[22px] bg-cream p-3">
                {d.images?.[0] ? (
                  <img src={d.images[0]} alt={d.title} loading="lazy" className="h-[200px] w-full rounded-[16px] object-cover" />
                ) : (
                  <div className="h-[200px] rounded-[16px] bg-blush" />
                )}
                <div className="px-2 pb-2 pt-3.5">
                  <span className="text-[11px] uppercase tracking-[1.5px] text-[#9A7A10]">{d.section?.name}</span>
                  <h3 className="mt-1 font-heading text-[21px] font-medium">{d.title}</h3>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Planning something special? */}
      <section id="plan" className="mx-auto max-w-[1000px] px-6 py-[80px] text-center sm:py-[110px]">
        <h2 className="font-heading text-[30px] font-medium leading-[1.25] sm:text-[40px]">
          Planning something special?
        </h2>
        <p className="mx-auto mb-8 mt-4 max-w-[480px] text-[16px] leading-[1.7] text-plum-soft">
          Send us a message on WhatsApp and we'll help you design your perfect day.
        </p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full bg-gold px-[34px] py-4 text-[15px] font-medium text-ink transition-[background] duration-200 hover:bg-gold-hover"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z" />
          </svg>
          Chat on WhatsApp
        </a>
      </section>
    </>
  )
}
