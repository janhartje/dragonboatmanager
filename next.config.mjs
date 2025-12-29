/* global process */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Schaltet PWA im Dev-Modus aus (nervt sonst beim Debuggen), im Build an
  disable: process.env.NODE_ENV === "development",
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

export default withPWA(nextConfig);
