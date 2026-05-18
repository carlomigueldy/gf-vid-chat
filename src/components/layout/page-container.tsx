import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10 w-full', className)}>
      {children}
    </div>
  )
}
