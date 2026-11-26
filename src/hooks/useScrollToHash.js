import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to top on route change, or to the element matching the URL hash
 * (e.g. /#contact) so in-page nav links work with React Router.
 * Links can pass state={{ preserveScroll: true }} to keep the current position
 * (used by the menu category pills).
 */
export default function useScrollToHash() {
  const { pathname, hash, state } = useLocation()

  useEffect(() => {
    if (state?.preserveScroll) return
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash])
}
