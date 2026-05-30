import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from '@/context/theme-context'
import { Header } from '@/components/layout/header'

const HomePage = lazy(() => import('@/pages/home-page'))
const RoomPage = lazy(() => import('@/pages/room-page'))
const SettingsPage = lazy(() => import('@/pages/settings-page'))

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
    </div>
  )
}

function AppShell() {
  const location = useLocation()
  const isRoomPage = location.pathname.startsWith('/room/')

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {!isRoomPage && <Header />}
      <main id="main" className={isRoomPage ? 'flex-1' : 'flex-1 flex flex-col'}>
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  )
}
