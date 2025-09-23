/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["gglkagcmyfdyojtgrzyv.supabase.co"],
  },
};

module.exports = nextConfig;