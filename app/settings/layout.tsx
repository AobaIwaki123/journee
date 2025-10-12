import { Metadata } from 'next';

/**
 * Phase 10.1: 設定ページOGPメタデータ
 * クライアントコンポーネントのため、layout.tsxでメタデータ設定
 */
export const metadata: Metadata = {
  title: '設定 | Journee',
  description: 'Journeeの設定ページ。AI、効果音、アカウント情報を管理します。',
  openGraph: {
    title: '設定 | Journee',
    description: 'Journeeの設定ページ',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '設定 | Journee',
    description: 'Journeeの設定ページ',
    images: ['/api/og/default'],
  },
  robots: {
    index: false, // 設定ページは個人情報のため検索エンジンにインデックスしない
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
