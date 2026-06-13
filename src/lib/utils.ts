import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Render integer cents as a locale-aware currency string. */
export function formatPrice(
  cents: number,
  currency = 'CAD',
  locale: 'en' | 'fr' = 'en',
): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
