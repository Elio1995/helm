import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>{t('tagline')}</p>
        <a
          href="https://github.com/eliomehmeti/helm"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          {t('github')}
        </a>
      </div>
    </footer>
  );
}
