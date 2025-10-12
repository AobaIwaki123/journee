import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { StorageMigration } from '@/components/migration/StorageMigration';

export const metadata: Metadata = {
  title: 'Journee - AI旅のしおり作成アプリ',
  description: 'AIとともに旅のしおりを作成するアプリケーション。チャット形式で簡単に旅行計画を立て、美しいしおりを自動生成。',
  manifest: '/manifest.json',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
    'http://localhost:3000'
  ),
  openGraph: {
    title: 'Journee - AI旅のしおり作成アプリ',
    description: 'AIとともに旅のしおりを作成するアプリケーション。チャット形式で簡単に旅行計画を立て、美しいしおりを自動生成。',
    url: '/',
    siteName: 'Journee',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Journee - AI旅のしおり作成アプリ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Journee - AI旅のしおり作成アプリ',
    description: 'AIとともに旅のしおりを作成するアプリケーション。',
    images: ['/images/og-default.png'],
    creator: '@journee_app',
    site: '@journee_app',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Journee',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
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
