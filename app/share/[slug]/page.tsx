import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicItineraryView from '@/components/itinerary/PublicItineraryView';
import { itineraryRepository } from '@/lib/db/itinerary-repository';

interface PageProps {
  params: { slug: string };
}

/**
 * Phase 8: OGPメタデータ生成（Database版）
 * SNS共有時のリッチプレビュー表示
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // データベースから公開しおりを取得
  const itinerary = await itineraryRepository.getPublicItinerary(params.slug);

  if (!itinerary) {
    return {
      title: 'しおりが見つかりません | Journee',
      description: '指定されたしおりは存在しないか、非公開に設定されています。',
    };
  }

  const ogTitle = `${itinerary.title} | Journee`;
  const ogDescription = itinerary.summary 
    ? itinerary.summary 
    : `${itinerary.destination}への${itinerary.schedule?.length || 0}日間の旅行計画`;
  
  const ogImage = itinerary.schedule?.[0]?.spots?.[0]?.imageUrl || '/images/default-thumbnail.jpg';

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      url: `/share/${params.slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: itinerary.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

/**
 * Phase 8: 公開しおり閲覧ページ（Database版）
 */
export default async function PublicItineraryPage({ params }: PageProps) {
  // データベースから公開しおりを取得
  const itinerary = await itineraryRepository.getPublicItinerary(params.slug);

  // 閲覧数をインクリメント（非同期で実行、エラーは無視）
  if (itinerary) {
    itineraryRepository.incrementViewCount(params.slug).catch(err => {
      console.error('Failed to increment view count:', err);
    });
  }

  if (!itinerary) {
    notFound();
  }
  
  return <PublicItineraryView slug={params.slug} itinerary={itinerary} />;
}
