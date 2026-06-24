import { routing } from '@/i18n/routing';
import { describe, expect, it } from 'vitest';

// Cheap structural checks on the routing config. The point isn't to test
// next-intl — it's to fail loudly when someone deletes a locale or flips the
// default, because both have user-visible URL consequences.
describe('i18n routing config', () => {
  it('supports exactly EN and FR', () => {
    expect([...routing.locales].sort()).toEqual(['en', 'fr']);
  });

  it('defaults to EN', () => {
    expect(routing.defaultLocale).toBe('en');
  });

  it('always prefixes the locale in the URL', () => {
    expect(routing.localePrefix).toBe('always');
  });
});
