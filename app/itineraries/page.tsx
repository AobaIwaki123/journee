import type { Metadata } from 'next';
import { ItineraryListClient } from '@/components/itinerary/ItineraryListClient';

/**
 * Phase 10.1: しおり一覧ページOGPメタデータ
 * サーバーコンポーネント化によりメタデータ設定が可能に
 */
export const metadata: Metadata = {
  title: 'しおり一覧 | Journee',
  description: '作成した旅のしおり一覧。お気に入りのしおりを探して、編集・共有できます。',
  openGraph: {
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおり一覧。お気に入りのしおりを探して、編集・共有できます。',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおり一覧',
    images: ['/api/og/default'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * しおり一覧ページ（サーバーコンポーネント）
 * Phase 10.1: メタデータ設定のためサーバーコンポーネント化
 */
export default function ItinerariesPage() {
  return <ItineraryListClient />;
}