import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Schaltet PWA im Dev-Modus aus (nervt sonst beim Debuggen), im Build an
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
};

export default withPWA(nextConfig);
