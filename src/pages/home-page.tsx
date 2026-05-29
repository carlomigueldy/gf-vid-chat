import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/page-container'
import { CreateRoom } from '@/components/room/create-room'
import { JoinRoom } from '@/components/room/join-room'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/segmented-control'
import { pageVariants, panelSwap } from '@/lib/animations'

type Mode = 'start' | 'join'

const MODE_OPTIONS: SegmentedOption<Mode>[] = [
  { value: 'start', label: 'Start a room' },
  { value: 'join', label: 'Join a room' },
]

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('start')

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 bg-warm-gradient"
    >
      <PageContainer className="max-w-md">
        <main>
          <section className="text-center mb-7 mt-2 md:mt-6">
            <h1 className="font-display font-semibold tracking-tight text-[var(--foreground)] text-[clamp(1.9rem,7vw,2.75rem)] leading-[1.05]">
              Stay close,
              <br />
              even asleep. <span aria-hidden="true">💗</span>
            </h1>
            <p className="mt-3 text-[var(--muted-foreground)] text-balance">
              No accounts. No servers. Just you two — and a connection that mends itself all night.
            </p>
          </section>

          <SegmentedControl
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
            ariaLabel="Start or join a room"
            layoutId="home-mode-thumb"
            className="mb-5"
          />

          <AnimatePresence>
            <motion.div key={mode} variants={panelSwap} initial="initial" animate="animate" exit="exit">
              {mode === 'start' ? <CreateRoom /> : <JoinRoom />}
            </motion.div>
          </AnimatePresence>
        </main>
      </PageContainer>
    </motion.div>
  )
}
