import type { Metadata } from 'next';
import { ItineraryListClient } from '@/components/itinerary/ItineraryListClient';

/**
 * しおり一覧ページ（サーバーコンポーネント）
 * - メタデータ設定
 * - OGP対応
 * 
 * Phase 10.5: OGP対応のためサーバーコンポーネント化
 */

export const metadata: Metadata = {
  title: 'しおり一覧 | Journee',
  description: '作成した旅のしおり一覧。お気に入りのしおりを探して、編集・共有できます。',
  openGraph: {
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおり一覧',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおり一覧',
    images: ['/api/og/default'],
  },
};

export default function ItinerariesPage() {
  return <ItineraryListClient />;
}