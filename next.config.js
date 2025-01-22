/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress specific HTML attributes warnings
  reactStrictMode: true,
  compiler: {
    // Suppress the "Extra attributes from the server" warning
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-gr-.*$'] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      }
    ],
  },
}

module.exports = nextConfig 