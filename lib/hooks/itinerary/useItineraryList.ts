/**
 * Phase 4: しおり一覧管理用カスタムHook
 * Phase 10: useItineraryUIStore, useUIStoreに移行
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useItineraryUIStore } from '@/lib/store/itinerary';
import { useUIStore } from '@/lib/store/ui';
import type { ItineraryData, ItineraryListItem } from '@/types/itinerary';
import { loadItinerariesFromStorage } from '@/lib/mock-data/itineraries';

export interface UseItineraryListReturn {
  itineraries: ItineraryListItem[];
  isLoading: boolean;
  error: string | null;
  filter: any;
  sort: any;
  setFilter: (filter: any) => void;
  setSort: (sort: any) => void;
  resetFilters: () => void;
  refresh: () => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
}

export function useItineraryList(): UseItineraryListReturn {
  const [itineraries, setItineraries] = useState<ItineraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session } = useSession();
  
  // Phase 10: 分割されたStoreを使用
  const { filter, sort, setFilter, setSort, resetFilters } = useItineraryUIStore();
  const { addToast } = useUIStore();

  const fetchItineraries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (session?.user?.id) {
        const response = await fetch('/api/itinerary/list');
        
        if (!response.ok) {
          throw new Error('しおりの取得に失敗しました');
        }

        const data = await response.json();
        setItineraries(data.itineraries || []);
        } else {
          const mockItineraries = loadItinerariesFromStorage();
          setItineraries(mockItineraries as ItineraryListItem[]);
        }
    } catch (err: any) {
      console.error('Failed to fetch itineraries:', err);
      setError(err.message || 'しおりの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const deleteItinerary = useCallback(
    async (id: string) => {
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/itinerary/delete?id=${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('削除に失敗しました');
          }
        }

        setItineraries((prev) => prev.filter((item) => item.id !== id));
        addToast('しおりを削除しました', 'success');
      } catch (err: any) {
        console.error('Failed to delete itinerary:', err);
        addToast(err.message || '削除に失敗しました', 'error');
      }
    },
    [session, addToast]
  );

  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  return {
    itineraries,
    isLoading,
    error,
    filter,
    sort,
    setFilter,
    setSort,
    resetFilters,
    refresh: fetchItineraries,
    deleteItinerary,
  };
}
