import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('nav');
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">That page doesn't exist (or it's been moved).</p>
      <Button asChild className="mt-8">
        <Link href="/">{t('home')}</Link>
      </Button>
    </div>
  );
}
