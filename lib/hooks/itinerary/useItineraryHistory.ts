/**
 * useItineraryHistory - Undo/Redo管理
 * 
 * 履歴管理とUndo/Redo操作をカプセル化するカスタムHook
 */

import { useCallback } from 'react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryData } from '@/types/itinerary';

export interface UseItineraryHistoryReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  
  // Operations
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Advanced
  getHistoryAt: (index: number) => ItineraryData | null;
  jumpToHistory: (index: number) => void;
}

/**
 * しおり履歴管理用カスタムHook
 */
export function useItineraryHistory(): UseItineraryHistoryReturn {
  // Zustand storeから履歴関連の状態とアクションを取得
  const history = useStore((state) => state.history);
  const undoAction = useStore((state) => state.undo);
  const redoAction = useStore((state) => state.redo);
  const canUndoFn = useStore((state) => state.canUndo);
  const canRedoFn = useStore((state) => state.canRedo);
  const setItinerary = useStore((state) => state.setItinerary);

  const canUndo = canUndoFn();
  const canRedo = canRedoFn();
  const historySize = history.past.length + history.future.length + (history.present ? 1 : 0);

  // 元に戻す
  const undo = useCallback(() => {
    undoAction();
  }, [undoAction]);

  // やり直す
  const redo = useCallback(() => {
    redoAction();
  }, [redoAction]);

  // 履歴をクリア（注意: この機能は慎重に使用すること）
  const clearHistory = useCallback(() => {
    // Zustand storeに履歴クリア用のアクションがあればそれを使用
    // なければ、現在の状態のみを保持して履歴を空にする
    // この実装は useStore に clearHistory アクションを追加する必要がある
    console.warn('clearHistory is not yet implemented in the store');
  }, []);

  // 指定されたインデックスの履歴を取得
  const getHistoryAt = useCallback(
    (index: number): ItineraryData | null => {
      const totalHistory = [
        ...history.past,
        ...(history.present ? [history.present] : []),
        ...history.future,
      ];

      if (index < 0 || index >= totalHistory.length) {
        return null;
      }

      return totalHistory[index];
    },
    [history]
  );

  // 指定されたインデックスの履歴にジャンプ
  const jumpToHistory = useCallback(
    (index: number) => {
      const targetItinerary = getHistoryAt(index);
      
      if (!targetItinerary) {
        console.warn(`Invalid history index: ${index}`);
        return;
      }

      // 現在の位置を計算
      const currentIndex = history.past.length;
      
      if (index < currentIndex) {
        // 過去に戻る
        const stepsBack = currentIndex - index;
        for (let i = 0; i < stepsBack; i++) {
          undo();
        }
      } else if (index > currentIndex) {
        // 未来に進む
        const stepsForward = index - currentIndex;
        for (let i = 0; i < stepsForward; i++) {
          redo();
        }
      }
      // index === currentIndex の場合は何もしない
    },
    [getHistoryAt, history.past.length, undo, redo]
  );

  return {
    // State
    canUndo,
    canRedo,
    historySize,

    // Operations
    undo,
    redo,
    clearHistory,

    // Advanced
    getHistoryAt,
    jumpToHistory,
  };
}
