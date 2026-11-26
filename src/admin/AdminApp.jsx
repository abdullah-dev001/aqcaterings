import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, RequireAuth } from './auth.jsx'
import AdminLayout from './AdminLayout.jsx'
import Login from './pages/Login.jsx'
import SectionsPage from './pages/SectionsPage.jsx'
import ItemsPage from './pages/ItemsPage.jsx'
import HeroSlidesPage from './pages/HeroSlidesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

/** Everything under /admin. Loaded lazily from App.jsx. */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Poppins, sans-serif', borderRadius: '18px' } }}
      />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="events" replace />} />
            <Route path="events" element={<SectionsPage kind="event" key="event" />} />
            <Route path="events/:sectionId" element={<ItemsPage kind="event" />} />
            <Route path="menu" element={<SectionsPage kind="menu" key="menu" />} />
            <Route path="menu/:sectionId" element={<ItemsPage kind="menu" />} />
            <Route path="hero" element={<HeroSlidesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="events" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
