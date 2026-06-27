import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-600 text-white',
        secondary:
          'border-transparent bg-[var(--muted)] text-[var(--text-secondary)]',
        destructive:
          'border-transparent bg-error-500 text-white',
        outline:
          'border-[var(--border)] text-[var(--text-primary)]',
        success:
          'border-transparent bg-success-500 text-white',
        warning:
          'border-transparent bg-accent-500 text-white',
        premium:
          'border-transparent bg-gradient-to-r from-primary-600 to-secondary-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
