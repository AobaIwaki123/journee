import { Metadata } from 'next';
import { ItineraryListClient } from '@/components/itinerary/ItineraryListClient';

/**
 * Phase 10: OGPメタデータ生成
 */
export const metadata: Metadata = {
  title: 'しおり一覧 | Journee',
  description: 'Journeeで作成した旅のしおり一覧。あなたの旅行計画を一覧で確認し、フィルター・ソートで簡単に管理できます。',
  robots: {
    index: false, // しおり一覧は検索エンジンにインデックスさせない（ユーザー固有）
    follow: true,
  },
  openGraph: {
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおりを一覧表示。フィルター・ソート機能で簡単管理。',
    type: 'website',
    url: '/itineraries',
    siteName: 'Journee',
    locale: 'ja_JP',
    images: [
      {
        url: '/api/og/default',
        width: 1200,
        height: 630,
        alt: 'Journee - しおり一覧',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおりを一覧表示',
    images: ['/api/og/default'],
  },
};

/**
 * しおり一覧ページ
 * Phase 10: サーバーコンポーネント化（OGPメタデータ対応）
 */
export default function ItinerariesPage() {
  return <ItineraryListClient />;
}
