/**
 * useItineraryHistoryStore のユニットテスト
 */

import { renderHook, act } from '@testing-library/react';
import { useItineraryHistoryStore } from '../useItineraryHistoryStore';
import type { ItineraryData } from '@/types/itinerary';

describe('useItineraryHistoryStore', () => {
  const createMockItinerary = (id: string, title: string): ItineraryData => ({
    id,
    title,
    destination: 'Tokyo',
    schedule: [],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('addToHistory', () => {
    it('履歴にしおりを追加する', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');

      act(() => {
        result.current.addToHistory(itinerary1);
      });

      expect(result.current.history.present).toEqual(itinerary1);
      expect(result.current.history.past).toHaveLength(0);
      expect(result.current.history.future).toHaveLength(0);
    });

    it('複数回追加すると履歴が蓄積される', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');
      const itinerary2 = createMockItinerary('2', 'Second');

      act(() => {
        result.current.addToHistory(itinerary1);
      });

      act(() => {
        result.current.addToHistory(itinerary2);
      });

      expect(result.current.history.present).toEqual(itinerary2);
      expect(result.current.history.past).toHaveLength(1);
      expect(result.current.history.past[0]).toEqual(itinerary1);
    });
  });

  describe('undo', () => {
    it('元に戻す', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');
      const itinerary2 = createMockItinerary('2', 'Second');

      act(() => {
        result.current.addToHistory(itinerary1);
        result.current.addToHistory(itinerary2);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.history.present).toEqual(itinerary1);
      expect(result.current.history.future[0]).toEqual(itinerary2);
    });

    it('履歴がない場合は何もしない', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      act(() => {
        result.current.undo();
      });

      expect(result.current.history.past).toHaveLength(0);
    });
  });

  describe('redo', () => {
    it('やり直す', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');
      const itinerary2 = createMockItinerary('2', 'Second');

      act(() => {
        result.current.addToHistory(itinerary1);
        result.current.addToHistory(itinerary2);
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.history.present).toEqual(itinerary2);
    });

    it('futureがない場合は何もしない', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      act(() => {
        result.current.redo();
      });

      expect(result.current.history.future).toHaveLength(0);
    });
  });

  describe('canUndo', () => {
    it('履歴がある場合はtrue', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');
      const itinerary2 = createMockItinerary('2', 'Second');

      act(() => {
        result.current.addToHistory(itinerary1);
        result.current.addToHistory(itinerary2);
      });

      expect(result.current.canUndo()).toBe(true);
    });

    it('履歴がない場合はfalse', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      expect(result.current.canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('futureがある場合はtrue', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');
      const itinerary2 = createMockItinerary('2', 'Second');

      act(() => {
        result.current.addToHistory(itinerary1);
        result.current.addToHistory(itinerary2);
        result.current.undo();
      });

      expect(result.current.canRedo()).toBe(true);
    });

    it('futureがない場合はfalse', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      expect(result.current.canRedo()).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('履歴をクリアする（presentは保持）', () => {
      const { result } = renderHook(() => useItineraryHistoryStore());

      const itinerary1 = createMockItinerary('1', 'First');
      const itinerary2 = createMockItinerary('2', 'Second');
      const itinerary3 = createMockItinerary('3', 'Third');

      act(() => {
        result.current.addToHistory(itinerary1);
        result.current.addToHistory(itinerary2);
        result.current.addToHistory(itinerary3);
        result.current.undo();
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history.past).toHaveLength(0);
      expect(result.current.history.future).toHaveLength(0);
      expect(result.current.history.present).toEqual(itinerary2);
    });
  });
});
