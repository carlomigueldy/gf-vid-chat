import '@testing-library/jest-dom'
import { MotionGlobalConfig } from 'framer-motion'

// Make Framer Motion animations instant in jsdom so AnimatePresence
// exit/enter (mode="wait") resolves synchronously in tests.
MotionGlobalConfig.skipAnimations = true

// jsdom does not implement matchMedia — provide a stub
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
