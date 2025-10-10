/**
 * useSpotEditor のユニットテスト
 */

import { renderHook, act } from '@testing-library/react';
import { useSpotEditor } from '../useSpotEditor';
import { useStore } from '@/lib/store/useStore';
import type { TouristSpot, ItineraryData } from '@/types/itinerary';

// モックの設定
jest.mock('@/lib/store/useStore');

describe('useSpotEditor', () => {
  const mockAddSpot = jest.fn();
  const mockUpdateSpot = jest.fn();
  const mockDeleteSpot = jest.fn();
  const mockReorderSpots = jest.fn();
  const mockMoveSpot = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        addSpot: mockAddSpot,
        updateSpot: mockUpdateSpot,
        deleteSpot: mockDeleteSpot,
        reorderSpots: mockReorderSpots,
        moveSpot: mockMoveSpot,
        currentItinerary: null,
      };
      return selector ? selector(state) : state;
    });
  });

  describe('validateSpot', () => {
    it('名前が必須であることを検証する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const validation = result.current.validateSpot({
        name: '',
        description: 'Test description',
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('スポット名は必須です');
    });

    it('名前が100文字を超えないことを検証する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const longName = 'a'.repeat(101);
      const validation = result.current.validateSpot({
        name: longName,
        description: 'Test',
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('100文字以内'))).toBe(true);
    });

    it('時刻がHH:mm形式であることを検証する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const validation = result.current.validateSpot({
        name: 'Test Spot',
        description: 'Test',
        scheduledTime: '25:00', // 無効な時刻
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('HH:mm形式'))).toBe(true);
    });

    it('滞在時間が24時間以内であることを検証する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const validation = result.current.validateSpot({
        name: 'Test Spot',
        description: 'Test',
        duration: 1500, // 1500分 > 1440分（24時間）
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('24時間以内'))).toBe(true);
    });

    it('有効なスポットを検証する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const validation = result.current.validateSpot({
        name: 'Valid Spot',
        description: 'Valid description',
        scheduledTime: '14:30',
        duration: 120,
        estimatedCost: 1000,
      });

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('addSpot', () => {
    it('IDを生成してスポットを追加する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const spot: Omit<TouristSpot, 'id'> = {
        name: 'Test Spot',
        description: 'Test description',
        category: 'sightseeing',
      };

      act(() => {
        result.current.addSpot(0, spot);
      });

      expect(mockAddSpot).toHaveBeenCalledWith(
        0,
        expect.objectContaining({
          ...spot,
          id: expect.any(String),
        })
      );
    });
  });

  describe('updateSpot', () => {
    it('スポットを更新する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const updates: Partial<TouristSpot> = {
        name: 'Updated Name',
        scheduledTime: '15:00',
      };

      act(() => {
        result.current.updateSpot(0, 'spot-123', updates);
      });

      expect(mockUpdateSpot).toHaveBeenCalledWith(0, 'spot-123', updates);
    });
  });

  describe('deleteSpot', () => {
    it('スポットを削除する', () => {
      const { result } = renderHook(() => useSpotEditor());

      act(() => {
        result.current.deleteSpot(0, 'spot-123');
      });

      expect(mockDeleteSpot).toHaveBeenCalledWith(0, 'spot-123');
    });
  });

  describe('reorderSpots', () => {
    it('スポットを並び替える', () => {
      const { result } = renderHook(() => useSpotEditor());

      act(() => {
        result.current.reorderSpots(0, 2, 0);
      });

      expect(mockReorderSpots).toHaveBeenCalledWith(0, 2, 0);
    });
  });

  describe('moveSpot', () => {
    it('スポットを別の日に移動する', () => {
      const { result } = renderHook(() => useSpotEditor());

      act(() => {
        result.current.moveSpot(0, 1, 'spot-123');
      });

      expect(mockMoveSpot).toHaveBeenCalledWith(0, 1, 'spot-123');
    });
  });

  describe('addMultipleSpots', () => {
    it('複数のスポットを追加する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const spots: Omit<TouristSpot, 'id'>[] = [
        { name: 'Spot 1', description: 'Desc 1' },
        { name: 'Spot 2', description: 'Desc 2' },
      ];

      act(() => {
        result.current.addMultipleSpots(0, spots);
      });

      expect(mockAddSpot).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteMultipleSpots', () => {
    it('複数のスポットを削除する', () => {
      const { result } = renderHook(() => useSpotEditor());

      const spotIds = ['spot-1', 'spot-2', 'spot-3'];

      act(() => {
        result.current.deleteMultipleSpots(0, spotIds);
      });

      expect(mockDeleteSpot).toHaveBeenCalledTimes(3);
      expect(mockDeleteSpot).toHaveBeenCalledWith(0, 'spot-1');
      expect(mockDeleteSpot).toHaveBeenCalledWith(0, 'spot-2');
      expect(mockDeleteSpot).toHaveBeenCalledWith(0, 'spot-3');
    });
  });
});
