// Root layout is intentionally minimal. The locale-scoped layout at
// `app/[locale]/layout.tsx` does the real work of setting <html lang>,
// loading messages, and rendering the header/footer chrome.

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
