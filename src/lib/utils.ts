import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: ['shadow-glow', 'shadow-warm', 'shadow-warm-md', 'shadow-warm-lg'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
