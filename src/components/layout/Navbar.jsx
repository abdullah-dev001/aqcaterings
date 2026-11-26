import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu as MenuIcon, X } from 'lucide-react'
import Skeleton from '../ui/Skeleton.jsx'
import { useSettings, useSections } from '../../hooks/useSiteData.js'
import { buildWhatsAppLink } from '../../lib/whatsapp.js'

const navLink = 'text-plum transition-colors hover:text-gold'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { data: settings, isLoading: settingsLoading } = useSettings()
  const { data: eventCategories, isLoading: eventsLoading } = useSections('event')
  const chatLink = buildWhatsAppLink(settings)
  const brandName = settings?.brand_name ?? ''
  const initial = /^[a-z]/i.test(brandName) ? brandName[0].toUpperCase() : 'B'

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [location.pathname, location.hash])

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => (document.body.style.overflow = '')
  }, [open])

  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-4 bg-cream px-[5%] py-5">
      <Link to="/" className="flex items-center gap-2.5 text-plum hover:text-plum">
        {settingsLoading ? (
          <>
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-6 w-36 rounded-full" />
          </>
        ) : (
          <>
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="" className="size-10 rounded-full object-cover" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-gold font-heading text-[20px] italic text-plum">
                {initial}
              </span>
            )}
            <span className="font-heading text-[22px] font-semibold tracking-[0.5px]">{brandName}</span>
          </>
        )}
      </Link>

      {/* Desktop links */}
      <nav className="hidden flex-wrap items-center gap-7 text-[14px] md:flex">
        <Link to="/#events" className={navLink}>
          Events
        </Link>
        <Link
          to="/menu"
          className={location.pathname.startsWith('/menu') ? 'text-gold transition-colors' : navLink}
        >
          Menu
        </Link>
        <Link to="/#contact" className={navLink}>
          Contact
        </Link>
        <a
          href={chatLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-plum px-5 py-2.5 text-cream"
        >
          Chat with us
        </a>
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 rounded-full p-2 text-plum transition-colors hover:bg-blush md:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X className="size-6" /> : <MenuIcon className="size-6" />}
      </button>

      {/* Mobile menu (overlay under the header) */}
      {open && (
        <div className="absolute inset-x-0 top-full h-[calc(100dvh-80px)] overflow-y-auto border-t border-blush bg-cream px-[5%] py-6 md:hidden">
          <div className="flex flex-col gap-1">
            <span className="mb-2 text-[13px] uppercase tracking-[3px] text-gold">Events</span>
            {eventsLoading &&
              [0, 1, 2, 3].map((k) => <Skeleton key={k} className="my-1.5 h-9 w-40 rounded-2xl" />)}
            {eventCategories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/events/${cat.slug}`}
                className="rounded-2xl px-3 py-3 font-heading text-xl text-plum transition-colors hover:bg-blush"
              >
                {cat.name}
              </Link>
            ))}
            <div className="my-4 h-px bg-blush" />
            <Link to="/menu" className="rounded-2xl px-3 py-3 font-heading text-xl text-plum hover:bg-blush">
              Menu
            </Link>
            <Link to="/#contact" className="rounded-2xl px-3 py-3 font-heading text-xl text-plum hover:bg-blush">
              Contact
            </Link>
            <a
              href={chatLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 rounded-full bg-plum px-5 py-3 text-center text-[14px] text-cream"
            >
              Chat with us
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
