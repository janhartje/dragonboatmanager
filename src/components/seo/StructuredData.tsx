'use client';

import Script from 'next/script';
import { useTranslations, useLocale } from 'next-intl';

export default function StructuredData() {
  const t = useTranslations('metadata');
  const locale = useLocale();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.drachenbootmanager.de/#website',
        'url': `https://www.drachenbootmanager.de/${locale}`,
        'name': t('title.default'),
        'description': t('description'),
        'publisher': {
          '@type': 'Person',
          'name': 'Jan Hartje'
        },
        'inLanguage': locale
      }
    ]
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
