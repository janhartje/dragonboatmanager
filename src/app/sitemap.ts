import { MetadataRoute } from 'next';
import { getProductionUrl } from '@/utils/url';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getProductionUrl();
  const paths = [
    '/',
    '/app',
    '/app/planner',
    '/features/lineup-planning',
    '/docs',
    '/help',
    '/legal/impressum',
    '/legal/datenschutz',
    '/legal/agb',
    '/legal/widerruf',
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  paths.forEach(path => {
    routing.locales.forEach(locale => {
      // Handle root path specifically to avoid double slashes or trailing slash issues if needed
      // But adhering to /{locale}/{path} structure:
      // / -> /de
      // /app -> /de/app
      
      const routePath = path === '/' ? '' : path;

      sitemap.push({
        url: `${baseUrl}/${locale}${routePath}`,
        lastModified: new Date(),
        changeFrequency: path.includes('legal') ? 'monthly' : 'weekly',
        priority: path === '/' ? 1.0 : (path.includes('app') ? 0.9 : 0.7),
      });
    });
  });

  return sitemap;
}
