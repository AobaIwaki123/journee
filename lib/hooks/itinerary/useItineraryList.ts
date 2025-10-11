/**
 * Phase 3: しおり一覧管理用カスタムHook
 * Phase 10: Store分割対応
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryUIStore } from '@/lib/store/itinerary';
import type { ItineraryData, ItineraryListItem } from '@/types/itinerary';
import { loadItineraryList } from '@/lib/mock-data/itineraries';

export interface ItineraryListReturn {
  itineraries: ItineraryListItem[];
  isLoading: boolean;
  error: string | null;
  filter: any;
  sort: any;
  setFilter: (filter: any) => void;
  setSort: (sort: any) => void;
  refresh: () => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
}

export function useItineraryList(): ItineraryListReturn {
  const { data: session } = useSession();
  const [itineraries, setItineraries] = useState<ItineraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 10: 分割されたStoreを使用
  const { addToast } = useUIStore();
  const { filter, sort, setFilter, setSort } = useItineraryUIStore();

  const loadItineraries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (session?.user) {
        const response = await fetch('/api/itinerary/list');
        if (!response.ok) {
          throw new Error('Failed to load itineraries');
        }
        const data = await response.json();
        setItineraries(data.itineraries || []);
      } else {
        const localItineraries = loadItineraryList();
        setItineraries(localItineraries);
      }
    } catch (err: any) {
      console.error('Failed to load itineraries:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  const deleteItinerary = useCallback(
    async (id: string) => {
      try {
        if (session?.user) {
          const response = await fetch(`/api/itinerary/delete?id=${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('Failed to delete itinerary');
          }
        }

        await loadItineraries();
        addToast('しおりを削除しました', 'info');
      } catch (err: any) {
        addToast(err.message || '削除に失敗しました', 'error');
      }
    },
    [session, loadItineraries, addToast]
  );

  return {
    itineraries,
    isLoading,
    error,
    filter,
    sort,
    setFilter,
    setSort,
    refresh: loadItineraries,
    deleteItinerary,
  };
}
