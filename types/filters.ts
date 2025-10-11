/**
 * Phase 10: フィルター・ソート型定義
 * 
 * useStore.tsから抽出
 */

/**
 * しおりフィルター条件
 */
export interface ItineraryFilter {
  status?: 'draft' | 'completed' | 'archived' | 'all';
  destination?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * しおりソート条件
 */
export type ItinerarySortField = 'updatedAt' | 'createdAt' | 'title' | 'startDate';
export type ItinerarySortOrder = 'asc' | 'desc';

export interface ItinerarySort {
  field: ItinerarySortField;
  order: ItinerarySortOrder;
}
