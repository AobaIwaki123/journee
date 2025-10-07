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
      bodySizeLimit: '2mb',
    },
  },

  // 画像の最適化設定
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig;
