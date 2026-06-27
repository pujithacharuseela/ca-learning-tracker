import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg',
        destructive:
          'bg-error-500 text-white shadow-md hover:bg-error-600 hover:shadow-lg',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--text-primary)] shadow-sm hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]',
        secondary:
          'bg-[var(--muted)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--surface-hover)]',
        ghost:
          'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
        link:
          'text-primary-600 underline-offset-4 hover:underline p-0 h-auto',
        premium:
          'bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 bg-[length:200%_100%] text-white shadow-lg hover:shadow-xl hover:bg-[position:100%_0] transition-all duration-500',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
