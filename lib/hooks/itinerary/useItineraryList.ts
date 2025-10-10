/**
 * useItineraryList - 一覧取得・フィルター
 * 
 * しおり一覧の取得、フィルタリング、ソート処理をカプセル化するカスタムHook
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';
import type { ItineraryListItem } from '@/types/itinerary';
import type { ItineraryFilter, ItinerarySort } from '@/lib/store/useStore';

export interface UseItineraryListOptions {
  initialFilter?: ItineraryFilter;
  initialSort?: ItinerarySort;
  pageSize?: number;
}

export interface UseItineraryListReturn {
  // Data
  itineraries: ItineraryListItem[];
  totalCount: number;
  
  // Loading state
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  
  // Filter & Sort
  filter: ItineraryFilter;
  sort: ItinerarySort;
  setFilter: (filter: ItineraryFilter) => void;
  setSort: (sort: ItinerarySort) => void;
  resetFilters: () => void;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Operations
  refresh: () => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
}

/**
 * しおり一覧管理用カスタムHook
 */
export function useItineraryList(
  options: UseItineraryListOptions = {}
): UseItineraryListReturn {
  const {
    initialFilter = { status: 'all' },
    initialSort = { field: 'updatedAt', order: 'desc' },
    pageSize = 20,
  } = options;

  const { data: session } = useSession();
  const [itineraries, setItineraries] = useState<ItineraryListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Zustand storeからフィルター・ソートの状態を取得
  const filter = useStore((state) => state.itineraryFilter);
  const sort = useStore((state) => state.itinerarySort);
  const setFilterAction = useStore((state) => state.setItineraryFilter);
  const setSortAction = useStore((state) => state.setItinerarySort);
  const resetFiltersAction = useStore((state) => state.resetItineraryFilters);
  const addToast = useStore((state) => state.addToast);

  // 初期化
  useEffect(() => {
    setFilterAction(initialFilter);
    setSortAction(initialSort);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // しおり一覧を取得
  const fetchItineraries = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        // APIエンドポイントを構築
        const params = new URLSearchParams();
        
        if (filter.status && filter.status !== 'all') {
          params.append('status', filter.status);
        }
        if (filter.destination) {
          params.append('destination', filter.destination);
        }
        if (filter.startDate) {
          params.append('startDate', filter.startDate);
        }
        if (filter.endDate) {
          params.append('endDate', filter.endDate);
        }
        
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.order);
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());

        // API呼び出し
        const response = await fetch(`/api/itinerary/list?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch itineraries');
        }

        const data = await response.json();
        
        setItineraries(data.itineraries || []);
        setTotalCount(data.total || 0);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        addToast('しおり一覧の取得に失敗しました', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filter, sort, currentPage, pageSize, addToast]
  );

  // フィルター・ソート・ページが変更されたら再取得
  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  // フィルター設定
  const setFilter = useCallback(
    (newFilter: ItineraryFilter) => {
      setFilterAction(newFilter);
      setCurrentPage(1); // フィルター変更時は1ページ目に戻る
    },
    [setFilterAction]
  );

  // ソート設定
  const setSort = useCallback(
    (newSort: ItinerarySort) => {
      setSortAction(newSort);
      setCurrentPage(1); // ソート変更時は1ページ目に戻る
    },
    [setSortAction]
  );

  // フィルターリセット
  const resetFilters = useCallback(() => {
    resetFiltersAction();
    setCurrentPage(1);
  }, [resetFiltersAction]);

  // 総ページ数を計算
  const totalPages = Math.ceil(totalCount / pageSize);

  // 次のページへ
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  // 前のページへ
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // 指定ページへジャンプ
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  // 一覧をリフレッシュ
  const refresh = useCallback(async () => {
    await fetchItineraries(true);
  }, [fetchItineraries]);

  // しおりを削除
  const deleteItinerary = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/itinerary/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete itinerary');
        }

        addToast('しおりを削除しました', 'success');
        
        // 一覧を再取得
        await fetchItineraries(true);
      } catch (err) {
        addToast('削除に失敗しました', 'error');
        throw err;
      }
    },
    [fetchItineraries, addToast]
  );

  return {
    // Data
    itineraries,
    totalCount,

    // Loading state
    isLoading,
    isRefreshing,
    error,

    // Filter & Sort
    filter,
    sort,
    setFilter,
    setSort,
    resetFilters,

    // Pagination
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,

    // Operations
    refresh,
    deleteItinerary,
  };
}
