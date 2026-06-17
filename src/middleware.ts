import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except:
  //   - Next.js internals
  //   - the Stripe webhook (must remain unprefixed for Stripe to find it)
  //   - static assets / SEO files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
