/**
 * useItineraryPublish - 公開・共有ロジック
 * 
 * しおりの公開設定とURL生成をカプセル化するカスタムHook
 */

import { useCallback, useState, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import type { PublicItinerarySettings } from '@/types/itinerary';

export interface PublishResult {
  success: boolean;
  publicUrl?: string;
  slug?: string;
  error?: string;
}

export interface UseItineraryPublishReturn {
  // State
  isPublic: boolean;
  publicUrl: string | null;
  publicSlug: string | null;
  isPublishing: boolean;
  
  // Settings
  allowPdfDownload: boolean;
  customMessage: string;
  
  // Operations
  publish: (settings: PublicItinerarySettings) => Promise<PublishResult>;
  unpublish: () => Promise<void>;
  updateSettings: (settings: Partial<PublicItinerarySettings>) => Promise<void>;
  
  // Sharing
  copyPublicUrl: () => Promise<void>;
  shareViaWebApi: () => Promise<void>;
  
  // Analytics
  viewCount: number;
  incrementViewCount: () => void;
}

/**
 * しおり公開用カスタムHook
 */
export function useItineraryPublish(
  itineraryId: string
): UseItineraryPublishReturn {
  const [isPublishing, setIsPublishing] = useState(false);

  // Zustand storeから必要な状態とアクションを取得
  const currentItinerary = useStore((state) => state.currentItinerary);
  const publishItineraryAction = useStore((state) => state.publishItinerary);
  const unpublishItineraryAction = useStore((state) => state.unpublishItinerary);
  const updatePublicSettingsAction = useStore((state) => state.updatePublicSettings);
  const addToast = useStore((state) => state.addToast);

  // 現在のしおりが指定されたIDと一致するか確認
  const itinerary = currentItinerary?.id === itineraryId ? currentItinerary : null;

  // 公開設定の取得
  const isPublic = itinerary?.isPublic ?? false;
  const publicSlug = itinerary?.publicSlug ?? null;
  const allowPdfDownload = itinerary?.allowPdfDownload ?? true;
  const customMessage = itinerary?.customMessage ?? '';
  const viewCount = itinerary?.viewCount ?? 0;

  // 公開URLの生成
  const publicUrl = publicSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${publicSlug}`
    : null;

  // 公開処理
  const publish = useCallback(
    async (settings: PublicItinerarySettings): Promise<PublishResult> => {
      if (!itinerary) {
        return {
          success: false,
          error: 'Itinerary not found',
        };
      }

      setIsPublishing(true);

      try {
        const result = await publishItineraryAction(settings);

        if (result.success) {
          addToast('しおりを公開しました', 'success');
        } else {
          addToast(result.error || '公開に失敗しました', 'error');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addToast('公開に失敗しました', 'error');

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsPublishing(false);
      }
    },
    [itinerary, publishItineraryAction, addToast]
  );

  // 非公開化
  const unpublish = useCallback(async (): Promise<void> => {
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    setIsPublishing(true);

    try {
      const result = await unpublishItineraryAction();

      if (result.success) {
        addToast('しおりを非公開にしました', 'success');
      } else {
        addToast(result.error || '非公開化に失敗しました', 'error');
      }
    } catch (error) {
      addToast('非公開化に失敗しました', 'error');
      throw error;
    } finally {
      setIsPublishing(false);
    }
  }, [itinerary, unpublishItineraryAction, addToast]);

  // 公開設定の更新
  const updateSettings = useCallback(
    async (settings: Partial<PublicItinerarySettings>): Promise<void> => {
      if (!itinerary || !isPublic) {
        throw new Error('Itinerary is not published');
      }

      try {
        updatePublicSettingsAction(settings);
        addToast('公開設定を更新しました', 'success');
      } catch (error) {
        addToast('設定の更新に失敗しました', 'error');
        throw error;
      }
    },
    [itinerary, isPublic, updatePublicSettingsAction, addToast]
  );

  // 公開URLをクリップボードにコピー
  const copyPublicUrl = useCallback(async (): Promise<void> => {
    if (!publicUrl) {
      addToast('公開URLがありません', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      addToast('URLをコピーしました', 'success');
    } catch (error) {
      addToast('コピーに失敗しました', 'error');
      throw error;
    }
  }, [publicUrl, addToast]);

  // Web Share APIで共有
  const shareViaWebApi = useCallback(async (): Promise<void> => {
    if (!publicUrl || !itinerary) {
      addToast('共有できるURLがありません', 'error');
      return;
    }

    // Web Share APIが利用可能かチェック
    if (typeof navigator === 'undefined' || !navigator.share) {
      addToast('この機能はお使いのブラウザではサポートされていません', 'error');
      return;
    }

    try {
      await navigator.share({
        title: itinerary.title,
        text: `${itinerary.destination}の旅のしおり - ${itinerary.title}`,
        url: publicUrl,
      });
      addToast('共有しました', 'success');
    } catch (error) {
      // ユーザーがキャンセルした場合はエラーを表示しない
      if (error instanceof Error && error.name !== 'AbortError') {
        addToast('共有に失敗しました', 'error');
      }
    }
  }, [publicUrl, itinerary, addToast]);

  // 閲覧数のインクリメント（将来の拡張用）
  const incrementViewCount = useCallback(() => {
    // TODO: APIを呼び出して閲覧数を更新
    console.log('Increment view count for itinerary:', itineraryId);
  }, [itineraryId]);

  return {
    // State
    isPublic,
    publicUrl,
    publicSlug,
    isPublishing,

    // Settings
    allowPdfDownload,
    customMessage,

    // Operations
    publish,
    unpublish,
    updateSettings,

    // Sharing
    copyPublicUrl,
    shareViaWebApi,

    // Analytics
    viewCount,
    incrementViewCount,
  };
}
