/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",

  // 環境変数の検証
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },

  // NEXT_PUBLIC_ で始まる環境変数は自動的にクライアントサイドで利用可能
  // ビルド時に NEXT_PUBLIC_ENABLE_MOCK_AUTH が設定される

  // APIルートのタイムアウトを延長（ストリーミング対応）
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // 画像の最適化設定
  images: {
    domains: ["maps.googleapis.com", "lh3.googleusercontent.com"],
  },
};

module.exports = nextConfig;
