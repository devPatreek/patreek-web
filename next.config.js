/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for GitHub Pages
  trailingSlash: false, // Disable trailing slashes for cleaner URLs
  eslint: {
    // Allow builds to proceed even if lint errors exist (local/dev usage)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permit builds to complete despite TS errors (local/dev usage)
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for static export
    domains: [
      'api.patreek.com',
      'cdn.prod.website-files.com',
      'imgur.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Ensure .well-known files are served correctly
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
