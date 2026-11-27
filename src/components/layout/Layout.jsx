import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import LanguageWelcome from './LanguageWelcome.jsx'
import useScrollToHash from '../../hooks/useScrollToHash.js'
import { LanguageProvider } from '../../i18n/LanguageContext.jsx'

export default function Layout() {
  useScrollToHash()

  // The language system only wraps the public site; the dashboard stays English/LTR.
  return (
    <LanguageProvider>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <LanguageWelcome />
    </LanguageProvider>
  )
}
