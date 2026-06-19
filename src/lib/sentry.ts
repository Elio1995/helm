// Sentry stub. Env-var gated so the project works with no DSN.
//
// The point isn't to ship a production SDK wrapper — it's to demonstrate that
// the error-reporting surface exists and is invoked from the right places
// (server actions, route handlers, webhook handler).
//
// When `NEXT_PUBLIC_SENTRY_DSN` is set, you'd swap the `captureException`
// implementation for the real `@sentry/nextjs` one. The call sites don't
// change.

interface SentryContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

const DSN_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export function captureException(err: unknown, context?: SentryContext): void {
  if (!DSN_CONFIGURED) {
    // Local dev: log to stderr so the trace shows up alongside Next's HMR output.
    if (process.env.NODE_ENV !== 'production') {
      console.error('[sentry-stub]', err, context ?? {});
    }
    return;
  }

  // Production path. In a real deploy, this would be:
  //   import * as Sentry from '@sentry/nextjs';
  //   Sentry.captureException(err, { tags: context?.tags, extra: context?.extra });
  // The shape above intentionally matches Sentry's so swapping is a 1-line change.
  console.error('[sentry]', err, context ?? {});
}

export function setUser(user: { email?: string } | null): void {
  if (!DSN_CONFIGURED) return;
  // Sentry.setUser(user) in production.
  void user;
}
