'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base — premium feel: subtle inset top-highlight, brand-glow focus ring,
  // spring scale on press, fluid color transitions.
  [
    'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md text-sm font-semibold tracking-tight',
    'transition-[transform,background-color,border-color,color,box-shadow,filter] duration-200',
    'ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[--color-border-focus]/40',
    'disabled:pointer-events-none disabled:opacity-50',
    "active:scale-[0.97]",
  ].join(' '),
  {
    variants: {
      variant: {
        // Premium brand button — gradient bg, inset highlight, brand glow on hover
        default: [
          'bg-[--color-brand] text-white',
          'shadow-[0_1px_0_0_oklch(1_0_0/0.15)_inset,0_1px_2px_0_oklch(0_0_0/0.4)]',
          'hover:bg-[--color-brand-strong] hover:shadow-[0_1px_0_0_oklch(1_0_0/0.2)_inset,0_0_24px_-4px_oklch(0.65_0.24_260/0.55)]',
          'hover:-translate-y-[1px]',
        ].join(' '),
        // Solid neutral (Linear-style "primary on dark") — for primary CTAs on light sections
        solid: [
          'bg-[--color-ink] text-[--color-surface]',
          'shadow-[0_1px_0_0_oklch(1_0_0/0.15)_inset,0_1px_2px_0_oklch(0_0_0/0.4)]',
          'hover:bg-[--color-brand] hover:text-white',
          'hover:-translate-y-[1px]',
        ].join(' '),
        // Secondary — quiet neutral fill
        secondary: [
          'bg-[--color-surface-subtle] text-[--color-ink]',
          'border border-[--color-border]',
          'hover:bg-[--color-surface-elevated] hover:border-[--color-border-strong]',
          'hover:-translate-y-[1px]',
        ].join(' '),
        // Outline — transparent + visible border
        outline: [
          'border border-[--color-border] bg-transparent text-[--color-ink]',
          'hover:bg-[--color-surface-subtle] hover:border-[--color-border-strong]',
        ].join(' '),
        // Ghost — no fill, no border, used for inline links / icon buttons
        ghost: [
          'bg-transparent text-[--color-ink-muted]',
          'hover:text-[--color-ink] hover:bg-[--color-surface-subtle]',
        ].join(' '),
        // Link — text-only with underline
        link: [
          'bg-transparent text-[--color-ink] underline-offset-4',
          'hover:text-[--color-brand] hover:underline',
        ].join(' '),
        // Destructive — for delete/clear actions
        destructive: [
          'bg-[--destructive] text-white',
          'hover:brightness-110 hover:-translate-y-[1px]',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        default: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
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
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
