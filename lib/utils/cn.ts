import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes safely.
 * Handles conditional classes and resolves conflicts.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-ds-accent', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
