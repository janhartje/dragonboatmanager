import { MetadataRoute } from 'next';
import { getProductionUrl } from '@/utils/url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getProductionUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/app/', '/*/app/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
