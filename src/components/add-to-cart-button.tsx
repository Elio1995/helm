'use client';

import { addToCart } from '@/lib/cart-actions';
import { cn } from '@/lib/utils';
import { Check, Loader2, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from './ui/button';

// Optimistic add-to-cart. The button briefly shows a checkmark on success so
// the user knows it worked without bouncing them to the cart page.
//
// Why optimistic vs. waiting on the server action:
//   - The server action revalidates the layout, which re-fetches the header's
//     cart count. So the badge will eventually agree with reality.
//   - But the badge update happens after the action resolves — usually 100ms
//     on local, sometimes 400ms over the wire. The local "Added" state hides
//     that latency so the click feels instant.
export function AddToCartButton({
  slug,
  size = 'default',
  className,
}: {
  slug: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}) {
  const t = useTranslations('books');
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  function onClick() {
    startTransition(async () => {
      const result = await addToCart({ bookSlug: slug, quantity: 1 });
      if (result.ok) {
        setJustAdded(true);
        // Reset after ~1.2s so subsequent clicks feel responsive.
        window.setTimeout(() => setJustAdded(false), 1200);
      } else {
        // In a real app, surface the error in a toast. For the demo, log it.
        console.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size={size}
      onClick={onClick}
      disabled={pending}
      className={cn('min-w-[140px]', className)}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : justAdded ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          {t('addedToCart')}
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {t('addToCart')}
        </>
      )}
    </Button>
  );
}
