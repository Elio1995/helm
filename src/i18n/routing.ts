import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr'] as const,
  defaultLocale: 'en',
  // Always include the locale in the URL — easier for SEO and analytics; no
  // ambiguity about which locale a given path serves.
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
