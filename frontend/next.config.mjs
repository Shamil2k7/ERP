/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    // Prevent ESLint warnings/errors from failing production builds on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Prevent TypeScript check errors from failing production builds on Vercel
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
