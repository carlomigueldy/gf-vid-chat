import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { CreateRoom } from '@/components/room/create-room'
import { JoinRoom } from '@/components/room/join-room'
import { pageVariants, staggerContainer, cardEntrance } from '@/lib/animations'

export default function HomePage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 bg-warm-gradient"
    >
      <PageContainer>
        <main>
          <motion.section
            className="text-center mb-8 md:mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
          >
            <h1 className="inline-flex items-center gap-2 text-4xl font-bold tracking-tight text-[var(--foreground)]">
              gf&#8209;vid&#8209;chat
              <Heart
                className="size-7 fill-[var(--primary)] text-[var(--primary)]"
                aria-hidden="true"
              />
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] mt-2">
              Stay connected while you sleep. No accounts, no servers, just you two.
            </p>
          </motion.section>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <motion.div variants={cardEntrance} className="h-full">
              <CreateRoom />
            </motion.div>
            <motion.div variants={cardEntrance} className="h-full">
              <JoinRoom />
            </motion.div>
          </motion.div>
        </main>
      </PageContainer>
    </motion.div>
  )
}
