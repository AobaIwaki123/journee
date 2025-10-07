/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 環境変数の検証
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },

  // APIルートのタイムアウトを延長（ストリーミング対応）
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // 画像の最適化設定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.pexels.com",
      },
      {
        protocol: "https",
        hostname: "**.pixabay.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;
