/**
 * useItineraryStore のユニットテスト
 */

import { renderHook, act } from '@testing-library/react';
import { useItineraryStore } from '../useItineraryStore';
import type { ItineraryData } from '@/types/itinerary';

describe('useItineraryStore', () => {
  beforeEach(() => {
    // LocalStorageをクリア
    localStorage.clear();
  });

  describe('setItinerary', () => {
    it('しおりを設定する', () => {
      const { result } = renderHook(() => useItineraryStore());

      const itinerary: ItineraryData = {
        id: 'test-1',
        title: 'Test Itinerary',
        destination: 'Tokyo',
        schedule: [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        result.current.setItinerary(itinerary);
      });

      expect(result.current.currentItinerary).toEqual(itinerary);
    });

    it('nullを設定できる', () => {
      const { result } = renderHook(() => useItineraryStore());

      // 最初にしおりを設定
      act(() => {
        result.current.setItinerary({
          id: 'test-1',
          title: 'Test',
          destination: 'Tokyo',
          schedule: [],
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // nullでクリア
      act(() => {
        result.current.setItinerary(null);
      });

      expect(result.current.currentItinerary).toBeNull();
    });
  });

  describe('updateItinerary', () => {
    it('しおりを部分更新する', () => {
      const { result } = renderHook(() => useItineraryStore());

      const itinerary: ItineraryData = {
        id: 'test-1',
        title: 'Original Title',
        destination: 'Tokyo',
        schedule: [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date('2024-01-01'),
      };

      act(() => {
        result.current.setItinerary(itinerary);
      });

      act(() => {
        result.current.updateItinerary({ title: 'Updated Title' });
      });

      expect(result.current.currentItinerary?.title).toBe('Updated Title');
      expect(result.current.currentItinerary?.destination).toBe('Tokyo');
      expect(result.current.currentItinerary?.updatedAt).not.toEqual(new Date('2024-01-01'));
    });

    it('しおりがnullの場合は何もしない', () => {
      const { result } = renderHook(() => useItineraryStore());

      act(() => {
        result.current.updateItinerary({ title: 'Updated Title' });
      });

      expect(result.current.currentItinerary).toBeNull();
    });
  });

  describe('updateItineraryTitle', () => {
    it('タイトルを更新する', () => {
      const { result } = renderHook(() => useItineraryStore());

      act(() => {
        result.current.setItinerary({
          id: 'test-1',
          title: 'Original',
          destination: 'Tokyo',
          schedule: [],
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      act(() => {
        result.current.updateItineraryTitle('New Title');
      });

      expect(result.current.currentItinerary?.title).toBe('New Title');
    });
  });

  describe('updateItineraryDestination', () => {
    it('行き先を更新する', () => {
      const { result } = renderHook(() => useItineraryStore());

      act(() => {
        result.current.setItinerary({
          id: 'test-1',
          title: 'Test',
          destination: 'Tokyo',
          schedule: [],
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      act(() => {
        result.current.updateItineraryDestination('Osaka');
      });

      expect(result.current.currentItinerary?.destination).toBe('Osaka');
    });
  });
});
