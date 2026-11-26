import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import EventCategory from './pages/EventCategory.jsx'
import Menu from './pages/Menu.jsx'
import MenuCategory from './pages/MenuCategory.jsx'
import NotFound from './pages/NotFound.jsx'

// The dashboard is a separate chunk: visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="min-h-dvh bg-cream" />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events/:slug" element={<EventCategory />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu/:slug" element={<MenuCategory />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
