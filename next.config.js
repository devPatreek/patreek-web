/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for GitHub Pages
  trailingSlash: true, // GitHub Pages works better with trailing slashes
  images: {
    unoptimized: true, // Required for static export
  images: {
    domains: [
      'patreekbackend-env.eba-ifvfvi7q.us-east-1.elasticbeanstalk.com',
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

