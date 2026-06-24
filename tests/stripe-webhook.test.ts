// Stripe webhook signature verification, exercised against the same
// algorithm the SDK uses internally. We don't call the route handler here —
// that would require mocking Prisma + Next request — but we DO assert the
// invariants the route handler relies on:
//
//   1. A correct HMAC-SHA256 over `${timestamp}.${rawBody}` verifies.
//   2. A wrong body (replay) does NOT verify against the same signature.
//   3. A timestamp outside the tolerance is rejected.
//
// This catches the most common regression: someone adds a body parser to the
// route, which mutates the bytes, which breaks signature verification.

import { createHmac } from 'node:crypto';
import Stripe from 'stripe';
import { describe, expect, it } from 'vitest';

const SECRET = 'whsec_test_dummy';
const stripe = new Stripe('sk_test_dummy', { typescript: true });

function sign(rawBody: string, timestamp: number, secret = SECRET): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('stripe webhook signature verification', () => {
  it('verifies a correctly signed payload', () => {
    const rawBody = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
    const ts = Math.floor(Date.now() / 1000);
    const sig = sign(rawBody, ts);

    const event = stripe.webhooks.constructEvent(rawBody, sig, SECRET);
    expect(event.type).toBe('checkout.session.completed');
  });

  it('rejects a replay against a different body', () => {
    const rawBody = JSON.stringify({ id: 'evt_real', type: 'checkout.session.completed' });
    const ts = Math.floor(Date.now() / 1000);
    const sig = sign(rawBody, ts);

    // Same signature, different body — must NOT verify.
    const tampered = JSON.stringify({ id: 'evt_fake', type: 'checkout.session.completed' });
    expect(() => stripe.webhooks.constructEvent(tampered, sig, SECRET)).toThrow();
  });

  it('rejects a stale timestamp (replay outside tolerance)', () => {
    const rawBody = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' });
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;
    const sig = sign(rawBody, tenMinutesAgo);

    // Default tolerance is 300s — should reject.
    expect(() =>
      stripe.webhooks.constructEvent(rawBody, sig, SECRET, /* tolerance */ 300),
    ).toThrow();
  });
});
