/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 480, 640, 828, 1080, 1200],
  },

  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

module.exports = nextConfig;