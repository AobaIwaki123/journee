/**
 * useSpotEditor - スポット編集ロジック
 * 
 * 観光スポットの追加・編集・削除・並び替えをカプセル化するカスタムHook
 */

import { useCallback } from 'react';
import { useStore } from '@/lib/store/useStore';
import type { TouristSpot } from '@/types/itinerary';
import { generateId } from '@/lib/utils/id-generator';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface UseSpotEditorReturn {
  // Spot operations
  addSpot: (dayIndex: number, spot: Omit<TouristSpot, 'id'>) => void;
  updateSpot: (dayIndex: number, spotId: string, updates: Partial<TouristSpot>) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  
  // Reordering
  reorderSpots: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;
  
  // Batch operations
  addMultipleSpots: (dayIndex: number, spots: Omit<TouristSpot, 'id'>[]) => void;
  deleteMultipleSpots: (dayIndex: number, spotIds: string[]) => void;
  
  // Validation
  validateSpot: (spot: Partial<TouristSpot>) => ValidationResult;
}

/**
 * スポット編集用カスタムHook
 */
export function useSpotEditor(): UseSpotEditorReturn {
  // Zustand storeから必要なアクションを取得
  const addSpotAction = useStore((state) => state.addSpot);
  const updateSpotAction = useStore((state) => state.updateSpot);
  const deleteSpotAction = useStore((state) => state.deleteSpot);
  const reorderSpotsAction = useStore((state) => state.reorderSpots);
  const moveSpotAction = useStore((state) => state.moveSpot);
  const currentItinerary = useStore((state) => state.currentItinerary);

  // スポット追加
  const addSpot = useCallback(
    (dayIndex: number, spot: Omit<TouristSpot, 'id'>) => {
      const newSpot: TouristSpot = {
        ...spot,
        id: generateId(),
      };
      addSpotAction(dayIndex, newSpot);
    },
    [addSpotAction]
  );

  // スポット更新
  const updateSpot = useCallback(
    (dayIndex: number, spotId: string, updates: Partial<TouristSpot>) => {
      updateSpotAction(dayIndex, spotId, updates);
    },
    [updateSpotAction]
  );

  // スポット削除
  const deleteSpot = useCallback(
    (dayIndex: number, spotId: string) => {
      deleteSpotAction(dayIndex, spotId);
    },
    [deleteSpotAction]
  );

  // スポット並び替え（同じ日内）
  const reorderSpots = useCallback(
    (dayIndex: number, fromIndex: number, toIndex: number) => {
      reorderSpotsAction(dayIndex, fromIndex, toIndex);
    },
    [reorderSpotsAction]
  );

  // スポット移動（異なる日間）
  const moveSpot = useCallback(
    (fromDayIndex: number, toDayIndex: number, spotId: string) => {
      moveSpotAction(fromDayIndex, toDayIndex, spotId);
    },
    [moveSpotAction]
  );

  // 複数スポット追加
  const addMultipleSpots = useCallback(
    (dayIndex: number, spots: Omit<TouristSpot, 'id'>[]) => {
      spots.forEach((spot) => {
        addSpot(dayIndex, spot);
      });
    },
    [addSpot]
  );

  // 複数スポット削除
  const deleteMultipleSpots = useCallback(
    (dayIndex: number, spotIds: string[]) => {
      spotIds.forEach((spotId) => {
        deleteSpot(dayIndex, spotId);
      });
    },
    [deleteSpot]
  );

  // スポットのバリデーション
  const validateSpot = useCallback(
    (spot: Partial<TouristSpot>): ValidationResult => {
      const errors: string[] = [];

      // 名前のバリデーション
      if (!spot.name || spot.name.trim().length === 0) {
        errors.push('スポット名は必須です');
      }
      if (spot.name && spot.name.length > 100) {
        errors.push('スポット名は100文字以内で入力してください');
      }

      // 説明のバリデーション
      if (spot.description && spot.description.length > 500) {
        errors.push('説明は500文字以内で入力してください');
      }

      // 時刻のバリデーション
      if (spot.scheduledTime) {
        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timePattern.test(spot.scheduledTime)) {
          errors.push('予定時刻はHH:mm形式で入力してください');
        }
      }

      // 滞在時間のバリデーション
      if (spot.duration !== undefined) {
        if (spot.duration < 0) {
          errors.push('滞在時間は0以上で入力してください');
        }
        if (spot.duration > 1440) {
          // 24時間 = 1440分
          errors.push('滞在時間は24時間以内で入力してください');
        }
      }

      // 予算のバリデーション
      if (spot.estimatedCost !== undefined) {
        if (spot.estimatedCost < 0) {
          errors.push('予算は0以上で入力してください');
        }
        if (spot.estimatedCost > 10000000) {
          // 1000万円
          errors.push('予算は10,000,000円以内で入力してください');
        }
      }

      // メモのバリデーション
      if (spot.notes && spot.notes.length > 1000) {
        errors.push('メモは1000文字以内で入力してください');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    []
  );

  return {
    addSpot,
    updateSpot,
    deleteSpot,
    reorderSpots,
    moveSpot,
    addMultipleSpots,
    deleteMultipleSpots,
    validateSpot,
  };
}
