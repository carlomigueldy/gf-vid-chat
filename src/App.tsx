import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from '@/context/theme-context'
import { Header } from '@/components/layout/header'
import HomePage from '@/pages/home-page'
import RoomPage from '@/pages/room-page'
import SettingsPage from '@/pages/settings-page'

function AppShell() {
  const location = useLocation()
  const isRoomPage = location.pathname.startsWith('/room/')

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {!isRoomPage && <Header />}
      <main id="main" className={isRoomPage ? 'flex-1' : 'flex-1 flex flex-col'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AnimatePresence>
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
