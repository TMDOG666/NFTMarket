// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ipfs-utils"],
  },
  reactStrictMode: true,
  // Ignoring typescript/eslint errors during build (deploy won't fail even if there are errors)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    domains: ['austingriffith.com'], // 允许跨域的图片域名
  },
  async headers(){
    return [
      {
          // matching all API routes
          source: "/:path*",
          headers: [
              { key: "Access-Control-Allow-Credentials", value: "https://austingriffith.com/images/paintings" },
              { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
              { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
              { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
          ]
      }
  ]
}

};

module.exports = nextConfig;
