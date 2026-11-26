import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarHeart, UtensilsCrossed, Images, Settings, ExternalLink, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase.js'
import BrandMark from './components/BrandMark.jsx'
import { IconBtn } from './components/ui.jsx'

const links = [
  { to: '/admin/events', label: 'Events', icon: CalendarHeart },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/admin/hero', label: 'Hero slides', short: 'Hero', icon: Images },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  async function logout() {
    await supabase.auth.signOut()
    qc.removeQueries({ queryKey: ['admin'] })
    toast.success('Logged out')
    navigate('/admin/login', { replace: true })
  }

  const sideLink = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition-colors ${
      isActive ? 'bg-plum text-cream' : 'text-plum hover:bg-blush'
    }`

  const tabLink = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
      isActive ? 'text-plum' : 'text-plum-soft'
    }`

  return (
    <div className="min-h-dvh bg-cream font-body text-plum">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#F3D9E1] bg-white px-4 py-6 md:flex">
        <div className="px-2 pb-8">
          <BrandMark />
          <p className="mt-2 pl-[50px] text-[12px] uppercase tracking-[2px] text-plum-soft">Dashboard</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={sideLink}>
              <Icon className="size-5" /> {label}
            </NavLink>
          ))}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-plum transition-colors hover:bg-blush"
          >
            <ExternalLink className="size-5" /> View site
          </a>
        </nav>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-plum-soft transition-colors hover:bg-blush hover:text-plum"
        >
          <LogOut className="size-5" /> Log out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#F3D9E1] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <BrandMark />
        <IconBtn label="Log out" onClick={logout}>
          <LogOut className="size-5" />
        </IconBtn>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 md:ml-64 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#F3D9E1] bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.map(({ to, label, short, icon: Icon }) => (
          <NavLink key={to} to={to} className={tabLink}>
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full ${isActive ? 'bg-blush' : ''}`}>
                  <Icon className="size-5" />
                </span>
                {short ?? label}
              </>
            )}
          </NavLink>
        ))}
        <a href="/" target="_blank" rel="noopener noreferrer" className={tabLink({ isActive: false })}>
          <span className="flex h-8 w-14 items-center justify-center">
            <ExternalLink className="size-5" />
          </span>
          View site
        </a>
      </nav>
    </div>
  )
}
