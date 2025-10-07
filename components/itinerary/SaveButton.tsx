'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { saveCurrentItinerary } from '@/lib/utils/storage';
import { updateItinerary, addItinerary } from '@/lib/mock-data/itineraries';

/**
 * Phase 5.2.8: しおり保存ボタン
 * 
 * 現在のしおりを一覧に保存し、一覧ページへ遷移
 */
export const SaveButton: React.FC = () => {
  const router = useRouter();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const addToast = useStore((state) => state.addToast);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentItinerary) return;

    setIsSaving(true);

    try {
      // LocalStorageに保存
      const success = saveCurrentItinerary(currentItinerary);

      if (success) {
        // しおり一覧に追加/更新
        const itineraries = JSON.parse(localStorage.getItem('journee_itineraries') || '[]');
        const existingIndex = itineraries.findIndex((item: any) => item.id === currentItinerary.id);

        if (existingIndex !== -1) {
          updateItinerary(currentItinerary.id, currentItinerary);
          addToast('しおりを更新しました', 'success');
        } else {
          addItinerary(currentItinerary);
          addToast('しおりを保存しました', 'success');
        }

        // しおり一覧ページへ遷移
        setTimeout(() => {
          router.push('/itineraries');
        }, 500);
      } else {
        addToast('保存に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to save itinerary:', error);
      addToast('保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentItinerary) return null;

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="しおりを保存して一覧へ"
    >
      {isSaving ? (
        <>
          <Save size={20} className="animate-pulse" />
          <span>保存中...</span>
        </>
      ) : (
        <>
          <CheckCircle size={20} />
          <span>保存して一覧へ</span>
        </>
      )}
    </button>
  );
};
