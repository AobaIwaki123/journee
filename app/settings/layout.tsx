import { Metadata } from 'next';

/**
 * Phase 10: 設定ページのOGPメタデータ
 */
export const metadata: Metadata = {
  title: '設定 | Journee',
  description: 'Journeeの設定画面。一般設定、AI設定、効果音設定、アカウント設定を管理できます。',
  robots: {
    index: false, // 設定ページは検索エンジンにインデックスさせない
    follow: true,
  },
  openGraph: {
    title: '設定 | Journee',
    description: 'Journeeのアプリケーション設定',
    type: 'website',
    url: '/settings',
    siteName: 'Journee',
    locale: 'ja_JP',
    images: [
      {
        url: '/api/og/default',
        width: 1200,
        height: 630,
        alt: 'Journee - 設定',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '設定 | Journee',
    description: 'Journeeのアプリケーション設定',
    images: ['/api/og/default'],
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
