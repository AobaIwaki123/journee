import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { StorageMigration } from "@/components/migration/StorageMigration";

// metadataBaseの設定
// 1. NEXT_PUBLIC_BASE_URL (環境変数で明示的に指定)
// 2. http://localhost:3000 (ローカル開発環境)
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return "http://localhost:3000";
};

export const metadata: Metadata = {
  title: "Journee - AI旅のしおり作成アプリ",
  description:
    "AIとともに旅のしおりを作成するアプリケーション。チャット形式で簡単に旅行計画を立て、美しいしおりを自動生成。",
  manifest: "/manifest.json",
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: "Journee - AI旅のしおり作成アプリ",
    description:
      "AIとともに旅のしおりを作成するアプリケーション。チャット形式で簡単に旅行計画を立て、美しいしおりを自動生成。",
    url: "/",
    siteName: "Journee",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/api/og/default",
        width: 1200,
        height: 630,
        alt: "Journee - AI旅のしおり作成アプリ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Journee - AI旅のしおり作成アプリ",
    description: "AIとともに旅のしおりを作成するアプリケーション。",
    images: ["/api/og/default"],
    creator: "@journee_app",
    site: "@journee_app",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Journee",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <AuthProvider>
          <StorageMigration />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
