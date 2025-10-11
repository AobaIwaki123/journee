/**
 * Phase 3: しおり公開用カスタムHook
 * Phase 10: useItineraryStore, useUIStoreに移行
 */

import { useState, useCallback } from 'react';
import { useItineraryStore } from '@/lib/store/itinerary';
import { useUIStore } from '@/lib/store/ui';
import type { ItineraryData, PublicItinerarySettings } from '@/types/itinerary';

export interface UseItineraryPublishReturn {
  isPublic: boolean;
  publicUrl: string | null;
  isPublishing: boolean;
  publish: (settings: PublicItinerarySettings) => Promise<{ success: boolean; publicUrl?: string; error?: string }>;
  unpublish: () => Promise<{ success: boolean; error?: string }>;
  updateSettings: (settings: Partial<PublicItinerarySettings>) => void;
  copyPublicUrl: () => Promise<boolean>;
  shareViaWebApi: () => Promise<boolean>;
}

export function useItineraryPublish(): UseItineraryPublishReturn {
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Phase 10: 分割されたStoreを使用
  const { currentItinerary, updateItinerary } = useItineraryStore();
  const { addToast } = useUIStore();
  
  const isPublic = currentItinerary?.isPublic || false;
  const publicUrl = currentItinerary?.publicSlug 
    ? `${window.location.origin}/share/${currentItinerary.publicSlug}`
    : null;

  const publish = useCallback(
    async (settings: PublicItinerarySettings): Promise<{ success: boolean; publicUrl?: string; error?: string }> => {
      if (!currentItinerary) {
        return { success: false, error: 'しおりが存在しません' };
      }

      try {
        setIsPublishing(true);
        
        const response = await fetch('/api/itinerary/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itineraryId: currentItinerary.id,
            settings,
            itinerary: currentItinerary,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || '公開に失敗しました' };
        }

        const updatedItinerary: ItineraryData = {
          ...currentItinerary,
          id: data.itineraryId,
          isPublic: settings.isPublic,
          publicSlug: data.slug,
          publishedAt: new Date(data.publishedAt),
          allowPdfDownload: settings.allowPdfDownload,
          customMessage: settings.customMessage,
          viewCount: 0,
          updatedAt: new Date(),
        };

        updateItinerary(updatedItinerary);
        addToast('しおりを公開しました', 'success');

        return {
          success: true,
          publicUrl: data.publicUrl,
        };
      } catch (error) {
        console.error('Error publishing itinerary:', error);
        const errorMessage = error instanceof Error ? error.message : '公開に失敗しました';
        addToast(errorMessage, 'error');
        return { success: false, error: errorMessage };
      } finally {
        setIsPublishing(false);
      }
    },
    [currentItinerary, updateItinerary, addToast]
  );

  const unpublish = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      if (!currentItinerary) {
        return { success: false, error: 'しおりが存在しません' };
      }

      try {
        setIsPublishing(true);

        const response = await fetch('/api/itinerary/unpublish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itineraryId: currentItinerary.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || '非公開化に失敗しました' };
        }

        const updatedItinerary: ItineraryData = {
          ...currentItinerary,
          isPublic: false,
          publicSlug: undefined,
          publishedAt: undefined,
          allowPdfDownload: undefined,
          customMessage: undefined,
          viewCount: undefined,
          updatedAt: new Date(),
        };

        updateItinerary(updatedItinerary);
        addToast('しおりを非公開にしました', 'info');

        return { success: true };
      } catch (error) {
        console.error('Error unpublishing itinerary:', error);
        const errorMessage = error instanceof Error ? error.message : '非公開化に失敗しました';
        addToast(errorMessage, 'error');
        return { success: false, error: errorMessage };
      } finally {
        setIsPublishing(false);
      }
    },
    [currentItinerary, updateItinerary, addToast]
  );

  const updateSettings = useCallback(
    (settings: Partial<PublicItinerarySettings>) => {
      if (!currentItinerary) return;

      updateItinerary({
        allowPdfDownload: settings.allowPdfDownload ?? currentItinerary.allowPdfDownload,
        customMessage: settings.customMessage ?? currentItinerary.customMessage,
        updatedAt: new Date(),
      });
    },
    [currentItinerary, updateItinerary]
  );

  const copyPublicUrl = useCallback(async (): Promise<boolean> => {
    if (!publicUrl) return false;

    try {
      await navigator.clipboard.writeText(publicUrl);
      addToast('URLをコピーしました', 'success');
      return true;
    } catch (error) {
      console.error('Failed to copy URL:', error);
      addToast('URLのコピーに失敗しました', 'error');
      return false;
    }
  }, [publicUrl, addToast]);

  const shareViaWebApi = useCallback(async (): Promise<boolean> => {
    if (!publicUrl || !currentItinerary) return false;

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentItinerary.title || '旅のしおり',
          text: `${currentItinerary.destination}への旅行計画を見てください！`,
          url: publicUrl,
        });
        return true;
      } else {
        await copyPublicUrl();
        return true;
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        addToast('共有に失敗しました', 'error');
      }
      return false;
    }
  }, [publicUrl, currentItinerary, copyPublicUrl, addToast]);

  return {
    isPublic,
    publicUrl,
    isPublishing,
    publish,
    unpublish,
    updateSettings,
    copyPublicUrl,
    shareViaWebApi,
  };
}
