'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';

// Language switcher. Client component because it needs `useRouter` to push
// the same route under a different locale. The transition keeps the new
// rendering pending without flashing.
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border bg-background p-0.5 text-xs',
        pending && 'opacity-60',
        className,
      )}
      // biome-ignore lint/a11y/useSemanticElements: <fieldset> implies form context; this is a button group toggle.
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchTo('en')}
        className={cn(
          'rounded px-2 py-0.5 transition-colors',
          locale === 'en' ? 'bg-secondary font-semibold' : 'text-muted-foreground',
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo('fr')}
        className={cn(
          'rounded px-2 py-0.5 transition-colors',
          locale === 'fr' ? 'bg-secondary font-semibold' : 'text-muted-foreground',
        )}
      >
        FR
      </button>
    </div>
  );
}
