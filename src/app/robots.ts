import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Cart and checkout exist per-user; no value to crawlers.
        disallow: ['/api/', '/en/cart', '/fr/cart', '/en/checkout', '/fr/checkout'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
