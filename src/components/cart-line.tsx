'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useOptimistic, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { CartLine as CartLineType } from '@/lib/cart';
import { removeCartItem, setCartItemQuantity } from '@/lib/cart-actions';
import { formatPrice } from '@/lib/utils';

// Optimistic quantity updates. The pattern:
//   1. User clicks +/-/trash.
//   2. `useOptimistic` updates the rendered quantity immediately.
//   3. Server action confirms — React reconciles with the real state.
//   4. On error, we don't bother rolling back the UI individually because the
//      action revalidates the layout and the server's authoritative state
//      wins. (In a real app we'd surface the error in a toast.)
export function CartLine({ line, locale }: { line: CartLineType; locale: 'en' | 'fr' }) {
  const t = useTranslations('cart');
  const [pending, startTransition] = useTransition();
  const [optimisticQty, setOptimisticQty] = useOptimistic(
    line.quantity,
    (_current, next: number) => next,
  );

  function changeQuantity(next: number) {
    startTransition(async () => {
      setOptimisticQty(next);
      await setCartItemQuantity({ cartItemId: line.id, quantity: next });
    });
  }

  function remove() {
    startTransition(async () => {
      setOptimisticQty(0);
      await removeCartItem({ cartItemId: line.id });
    });
  }

  const lineTotalCents = optimisticQty * line.unitPriceCents;

  return (
    <li className="flex gap-4 border-b py-4">
      <Link
        href={{ pathname: '/books/[slug]', params: { slug: line.slug } }}
        className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded bg-muted"
      >
        <Image src={line.imageUrl} alt={line.title} fill sizes="80px" className="object-cover" />
      </Link>

      <div className="flex flex-1 flex-col">
        <Link
          href={{ pathname: '/books/[slug]', params: { slug: line.slug } }}
          className="font-medium hover:underline"
        >
          {line.title}
        </Link>
        <p className="text-xs text-muted-foreground">{line.author}</p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-md border" aria-label={t('quantity')}>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
              onClick={() => changeQuantity(Math.max(0, optimisticQty - 1))}
              disabled={pending || optimisticQty <= 0}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{optimisticQty}</span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
              onClick={() => changeQuantity(Math.min(99, optimisticQty + 1))}
              disabled={pending}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> {t('remove')}
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium tabular-nums">
          {formatPrice(lineTotalCents, line.currency, locale)}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatPrice(line.unitPriceCents, line.currency, locale)}
        </p>
      </div>
    </li>
  );
}
