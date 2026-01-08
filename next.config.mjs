/* global process */
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: "public",
  // Schaltet PWA lokal aus (außer VERCEL ist gesetzt), im Deployment an
  disable: !process.env.VERCEL,
  register: true,
  skipWaiting: true,
});

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  outputFileTracingRoot: __dirname,
};

export default withPWA(withNextIntl(nextConfig));
