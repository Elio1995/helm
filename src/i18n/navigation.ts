import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware wrappers around `next/link`, `useRouter`, `redirect`, etc.
// Components should import these instead of from `next/navigation` so locale
// prefixes are added automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
