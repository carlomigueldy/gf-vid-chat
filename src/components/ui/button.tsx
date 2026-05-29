import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,box-shadow,filter] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-gradient text-[var(--primary-foreground)] shadow-glow hover:brightness-[1.05]',
        destructive:
          'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:brightness-[1.05]',
        outline:
          'border border-[var(--input)] bg-[var(--card)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
        secondary:
          'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80',
        ghost:
          'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 rounded-full px-5 py-2 text-sm',
        sm: 'h-9 rounded-full px-4 text-sm',
        lg: 'h-12 rounded-full px-7 text-base font-semibold',
        icon: 'size-11 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
