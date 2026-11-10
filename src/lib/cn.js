import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Gộp className, tự loại lớp Tailwind trùng nhau. */
export function cn(...args) {
  return twMerge(clsx(args))
}
