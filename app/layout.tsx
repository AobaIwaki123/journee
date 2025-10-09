import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Journee - AI旅のしおり作成アプリ',
  description: 'AIとともに旅のしおりを作成するアプリケーション。チャット形式で簡単に旅行計画を立て、美しいしおりを自動生成。',
  manifest: '/manifest.json',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
    'http://localhost:3000'
  ),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    title: 'Journee - AI旅のしおり作成アプリ',
    description: 'AIとともに旅のしおりを作成するアプリケーション。チャット形式で簡単に旅行計画を立て、美しいしおりを自動生成。',
    url: '/',
    siteName: 'Journee',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Journee - AI旅のしおり作成アプリ',
    description: 'AIとともに旅のしおりを作成するアプリケーション。',
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
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
