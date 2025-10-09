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

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      url: `${baseUrl}/share/${params.slug}`,
      siteName: "Journee",
      images: [
        {
          url: `${baseUrl}${ogImageUrl}`,
          width: 1200,
          height: 630,
          alt: itinerary.title,
        },
      ],
    },
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

  return (
    <PublicItineraryView
      slug={params.slug}
      itinerary={itinerary}
      currentUserId={session?.user?.id || null}
      initialComments={initialComments}
      initialCommentCount={commentCount}
    />
  );
}
