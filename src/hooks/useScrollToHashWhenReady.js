import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Card ids (e.g. /events/mehndi#floral-jhoola) only exist once data has loaded,
 * so scroll to the hash target again when `ready` flips to true.
 */
export default function useScrollToHashWhenReady(ready) {
  const { hash, state } = useLocation()

  useEffect(() => {
    if (!ready || !hash || state?.preserveScroll) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hash])
}
