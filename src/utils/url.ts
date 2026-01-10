/**
 * Get the base URL for the application.
 * 
 * Priority order:
 * 1. NEXT_PUBLIC_SERVER_URL - Explicit override (useful for custom domains)
 * 2. VERCEL_URL - Auto-generated deployment URL (unique per deployment, for previews)
 * 3. VERCEL_PROJECT_PRODUCTION_URL - Production custom domain (fallback)
 * 4. Fallback to localhost for development
 * 
 * @see https://vercel.com/docs/environment-variables/system-environment-variables
 */
export function getBaseUrl(): string {
  // Explicit override takes priority
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }

  // In production, use the custom domain
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Vercel deployment URL (unique per deployment, good for preview envs)
  // This comes BEFORE production URL so previews get their own URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Vercel production URL (fallback)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Local development fallback
  return 'http://localhost:3000';
}

/**
 * Get the production URL for the application.
 * Useful for OG images, canonical URLs, etc. that should always point to production.
 * 
 * Priority order:
 * 1. NEXT_PUBLIC_SERVER_URL - Explicit override
 * 2. VERCEL_PROJECT_PRODUCTION_URL - Production custom domain
 * 3. Fallback domain
 */
export function getProductionUrl(): string {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return 'https://dragonboatmanager.com';
}
