
import Script from 'next/script';

export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.drachenbootmanager.de/#website',
        'url': 'https://www.drachenbootmanager.de/',
        'name': 'Drachenboot Manager',
        'description': 'Plan your dragon boat team efficiently: member management, event planning, and optimal boat lineup with AI support.',
        'publisher': {
          '@type': 'Person',
          'name': 'Jan Hartje'
        },
        'inLanguage': ['de', 'en']
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
