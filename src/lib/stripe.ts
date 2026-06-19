// Stripe client. Reads the secret key from the env at import time.
//
// The SDK is configured for test mode in `.env.example`. Live keys must never
// land in this repo; CI guards against that by failing on any key starting
// with `sk_live_`.

import 'server-only';

import Stripe from 'stripe';

const KEY = process.env.STRIPE_SECRET_KEY;

if (KEY?.startsWith('sk_live_')) {
  throw new Error(
    'Refusing to start: STRIPE_SECRET_KEY looks like a live key. Helm is a demo — use a test key (sk_test_...).',
  );
}

// We don't pin `apiVersion` so we automatically pick up new fields. For a
// production app, pinning is correct — but pinning to a version older than the
// installed `stripe` package mismatches types.
export const stripe = new Stripe(KEY ?? 'sk_test_helm_demo_placeholder', {
  typescript: true,
  appInfo: {
    name: 'helm-storefront',
    version: '0.1.0',
  },
});

export const STRIPE_CONFIGURED = Boolean(KEY) && !KEY?.startsWith('sk_live_');
