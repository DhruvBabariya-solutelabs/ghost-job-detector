import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose Tailwind classes with conflict resolution. Standard shadcn helper.
 * Use inside variant-laden components so consumers can override classes
 * without manual concat.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
