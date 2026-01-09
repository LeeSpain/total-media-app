import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
        info: 'border-transparent bg-blue-500 text-white',
        commander: 'border-transparent bg-commander text-commander-foreground',
        scout: 'border-transparent bg-scout text-scout-foreground',
        spy: 'border-transparent bg-spy text-spy-foreground',
        writer: 'border-transparent bg-writer text-writer-foreground',
        artist: 'border-transparent bg-artist text-artist-foreground',
        broadcaster: 'border-transparent bg-broadcaster text-broadcaster-foreground',
        ambassador: 'border-transparent bg-ambassador text-ambassador-foreground',
        oracle: 'border-transparent bg-oracle text-oracle-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
