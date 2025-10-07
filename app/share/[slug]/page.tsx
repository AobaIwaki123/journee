import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicItineraryView from '@/components/itinerary/PublicItineraryView';
import { ItineraryData } from '@/types/itinerary';

interface PageProps {
  params: { slug: string };
}

/**
 * Phase 5.5: OGPメタデータ生成
 * SNS共有時のリッチプレビュー表示
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Phase 8以降: データベースから取得
  // const itinerary = await db.getPublicItinerary(params.slug);
  
  // Phase 5-7: LocalStorageから取得（クライアント側でのみ動作）
  // サーバーサイドではモックデータまたはnull
  const itinerary = null as ItineraryData | null; // TODO: Phase 8でDB統合

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
 * Phase 5.5: 公開しおり閲覧ページ
 */
export default async function PublicItineraryPage({ params }: PageProps) {
  // Phase 8以降: データベースから取得 + 閲覧数カウント
  // const itinerary = await db.getPublicItinerary(params.slug);
  // if (itinerary) {
  //   await db.incrementViewCount(params.slug);
  // }

  // Phase 5-7: LocalStorageベース（クライアント側で処理）
  // サーバーサイドではスラッグのみを渡す
  
  return <PublicItineraryView slug={params.slug} />;
}
