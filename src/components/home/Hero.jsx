import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHeroSlides, useSettings } from '../../hooks/useSiteData.js'
import { buildWhatsAppLink } from '../../lib/whatsapp.js'

const INTERVAL_MS = 5000

// Used when there are no hero slides (or they fail to load), so the hero still looks good.
const FALLBACK_SLIDES = [
  { id: 'fallback-1', color: '#7A3B5E' },
  { id: 'fallback-2', color: '#9C5A6E' },
  { id: 'fallback-3', color: '#4A2240' },
]

export default function Hero() {
  const [active, setActive] = useState(0)
  const { data: settings } = useSettings()
  const { data, isLoading } = useHeroSlides()

  // While loading, show the plain plum base (no slides) to avoid a flash of fallback colours.
  const slides = isLoading ? [] : data?.length ? data : FALLBACK_SLIDES
  const count = slides.length

  useEffect(() => {
    setActive(0)
    if (count < 2) return
    const t = setInterval(() => setActive((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(t)
  }, [count])

  return (
    <section
      id="top"
      className="relative mx-[2%] h-[560px] overflow-hidden rounded-[28px] bg-[#7A3B5E] sm:h-[680px]"
    >
      {/* Crossfading background slides with slow zoom */}
      {slides.map((slide, k) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-[ease]"
          style={{ opacity: k === active ? 1 : 0 }}
          aria-hidden={k !== active}
        >
          {slide.image_url ? (
            <img
              src={slide.image_url}
              alt=""
              className="absolute inset-0 size-full animate-kb object-cover"
              loading={k === 0 ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="absolute inset-0 animate-kb" style={{ background: slide.color }} />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-[rgba(43,16,34,.38)]" />

      <div className="relative z-[2] box-border flex h-full flex-col items-center justify-center px-6 text-center text-cream">
        <p className="mb-[18px] text-[11px] uppercase tracking-[3px] text-blush sm:text-[13px] sm:tracking-[4px]">
          Decor · Catering · Celebrations
        </p>
        <h1 className="max-w-[900px] font-heading text-[34px] font-medium leading-[1.1] sm:text-[clamp(40px,6vw,76px)]">
          Where every celebration{' '}
          <span className="italic text-[#F3D27A]">feels like a dream</span>
        </h1>
        <p className="mb-9 mt-[22px] max-w-[560px] text-[15px] font-light leading-[1.7] text-blush sm:text-[17px]">
          Elegant decor and delicious food for your Walima, Mehndi, Barat and Qawwali nights.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link
            to="/#events"
            className="rounded-full bg-gold px-[34px] py-[15px] text-[15px] font-medium text-ink transition-[background] duration-200 hover:bg-gold-hover"
          >
            Explore our events
          </Link>
          <a
            href={buildWhatsAppLink(settings)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[rgba(255,248,243,.7)] px-[30px] py-[15px] text-[15px] text-cream transition-[background] duration-200 hover:bg-[rgba(255,255,255,.18)]"
          >
            WhatsApp us
          </a>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-14 z-[2] flex justify-center gap-2">
        {count > 1 && slides.map((slide, k) => (
          <span
            key={slide.id}
            className="h-1.5 rounded-[3px] transition-all duration-500"
            style={{
              width: k === active ? 28 : 6,
              background: k === active ? '#C9A227' : 'rgba(255,248,243,.55)',
            }}
          />
        ))}
      </div>

      {/* Explore more */}
      <Link
        to="/#events"
        className="absolute bottom-3.5 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-0.5 text-[12px] tracking-[2px] text-blush"
      >
        <span>explore more</span>
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="animate-bob"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </Link>
    </section>
  )
}
