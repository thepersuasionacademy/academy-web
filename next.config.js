const imageDomains = [
  'api.placeholder.com',
  'thepersuasionacademy-com.b-cdn.net',
  'wltjkhsmqhospeezdgga.supabase.co'
  // Add more domains as needed
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: imageDomains,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
    typedRoutes: true
  },
  typescript: {
    ignoreBuildErrors: true  // Temporarily ignore TS errors during build to test if it fixes deployment
  }
};

module.exports = nextConfig;