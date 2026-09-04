import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...kelas: ClassValue[]): string {
  return twMerge(clsx(kelas))
}
