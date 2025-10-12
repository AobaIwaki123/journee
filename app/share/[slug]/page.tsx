import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import PublicItineraryView from "@/components/itinerary/PublicItineraryView";
import { itineraryRepository } from "@/lib/db/itinerary-repository";
import { commentRepository } from "@/lib/db/comment-repository";
import { authOptions } from "@/lib/auth/auth-options";
import { Comment } from "@/types/comment";

interface PageProps {
  params: { slug: string };
}

/**
 * Phase 10.2: OGPメタデータ生成（動的OGP画像対応）
 * SNS共有時のリッチプレビュー表示
 * + 構造化データ（JSON-LD）、robots、canonical等の追加
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // データベースから公開しおりを取得
  const itinerary = await itineraryRepository.getPublicItinerary(params.slug);

  if (!itinerary) {
    return {
      title: "しおりが見つかりません | Journee",
      description: "指定されたしおりは存在しないか、非公開に設定されています。",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const ogTitle = `${itinerary.title} | Journee`;
  const ogDescription = itinerary.summary
    ? itinerary.summary
    : `${itinerary.destination}への${
        itinerary.schedule?.length || 0
      }日間の旅行計画`;

  // Phase 10.2: 動的に生成されるOGP画像を使用
  const ogImageUrl = `/api/og?slug=${params.slug}`;

  // ベースURLを取得（本番環境・開発環境対応）
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const shareUrl = `${baseUrl}/share/${params.slug}`;

  return {
    title: ogTitle,
    description: ogDescription,
    // 検索エンジン最適化
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    // 正規URL
    alternates: {
      canonical: shareUrl,
    },
    // 作成者情報（将来的に実装）
    // authors: itinerary.user_name ? [{ name: itinerary.user_name }] : undefined,
    // キーワード（SEO）
    keywords: [
      itinerary.destination,
      "旅行",
      "しおり",
      "旅のしおり",
      "Journee",
      ...(itinerary.schedule?.flatMap((day) =>
        day.spots.map((spot) => spot.name)
      ) || []),
    ].filter(Boolean),
    // Open Graph
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      url: shareUrl,
      siteName: "Journee",
      locale: "ja_JP",
      images: [
        {
          url: `${baseUrl}${ogImageUrl}`,
          width: 1200,
          height: 630,
          alt: itinerary.title,
        },
      ],
    },
    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [`${baseUrl}${ogImageUrl}`],
      creator: "@journee_app",
      site: "@journee_app",
    },
  };
}

/**
 * Phase 8 + Phase 11: 公開しおり閲覧ページ（Database版 + コメント機能）
 */
export default async function PublicItineraryPage({ params }: PageProps) {
  // データベースから公開しおりを取得
  const itinerary = await itineraryRepository.getPublicItinerary(params.slug);

  if (!itinerary) {
    notFound();
  }

  // 閲覧数をインクリメント（非同期で実行、エラーは無視）
  itineraryRepository.incrementViewCount(params.slug).catch((err) => {
    console.error("Failed to increment view count:", err);
  });

  // セッション情報を取得
  const session = await getServerSession(authOptions);

  // 初期コメントデータを取得（Phase 11）
  let initialComments: Comment[] = [];
  let commentCount: number = 0;

  try {
    const commentsData = await commentRepository.listComments(
      {
        itineraryId: itinerary.id!,
        sortBy: "created_at",
        sortOrder: "desc",
      },
      {
        limit: 10,
        offset: 0,
      }
    );
    initialComments = commentsData.data;
    commentCount = commentsData.pagination.total;
  } catch (error) {
    console.error("Failed to fetch initial comments:", error);
  }

  // 構造化データ（JSON-LD）の生成
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: itinerary.title,
    description: itinerary.summary || `${itinerary.destination}への旅行計画`,
    touristType: "leisure",
    ...(itinerary.destination && {
      itinerary: {
        "@type": "Place",
        name: itinerary.destination,
      },
    }),
    ...(itinerary.schedule &&
      itinerary.schedule.length > 0 && {
        startDate: itinerary.schedule[0]?.date,
        endDate: itinerary.schedule[itinerary.schedule.length - 1]?.date,
      }),
    // 作成者情報（将来的に実装）
    // ...(itinerary.user_name && {
    //   creator: {
    //     "@type": "Person",
    //     name: itinerary.user_name,
    //   },
    // }),
    url: `${baseUrl}/share/${params.slug}`,
    image: `${baseUrl}/api/og?slug=${params.slug}`,
  };

  return (
    <>
      {/* 構造化データ（JSON-LD） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicItineraryView
        slug={params.slug}
        itinerary={itinerary}
        currentUserId={session?.user?.id || null}
        initialComments={initialComments}
        initialCommentCount={commentCount}
      />
    </>
  );
}
