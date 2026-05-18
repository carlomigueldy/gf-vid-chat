import { motion } from 'framer-motion'
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
      className="flex-1"
    >
      <PageContainer>
        <main>
          <motion.section
            className="text-center mb-8 md:mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
              gf&#8209;vid&#8209;chat
            </h1>
            <p className="text-lg text-[var(--muted-foreground)] mt-2">
              P2P video for couples — silent, always-on reconnect
            </p>
          </motion.section>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
