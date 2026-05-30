'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md border border-[--color-border]',
          'bg-[--color-surface-subtle] px-3.5 py-2 text-sm text-[--color-ink]',
          'placeholder:text-[--color-ink-subtle]',
          'transition-[border-color,box-shadow] duration-200',
          'hover:border-[--color-border-strong]',
          'focus-visible:outline-none focus-visible:border-[--color-brand]',
          'focus-visible:shadow-[0_0_0_3px_oklch(0.55_0.18_260/0.25)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[180px] w-full rounded-md border border-[--color-border]',
        'bg-[--color-surface-subtle] px-4 py-3 text-sm text-[--color-ink] leading-[1.55]',
        'placeholder:text-[--color-ink-subtle]',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-[--color-border-strong]',
        'focus-visible:outline-none focus-visible:border-[--color-brand]',
        'focus-visible:shadow-[0_0_0_3px_oklch(0.55_0.18_260/0.25)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-y',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Input, Textarea };
