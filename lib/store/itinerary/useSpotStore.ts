/**
 * useSpotStore - スポット管理のストア
 * 
 * 観光スポットのCRUD操作と並び替えを提供
 */

import { create } from 'zustand';
import type { TouristSpot, DaySchedule, ItineraryData } from '@/types/itinerary';
import {
  sortSpotsByTime,
  adjustTimeAfterReorder,
} from '@/lib/utils/time-utils';
import {
  updateDayBudget,
  updateItineraryBudget,
} from '@/lib/utils/budget-utils';
import { createHistoryUpdate } from '@/lib/store/helpers/history-helper';

interface SpotStore {
  // State - useItineraryStoreから参照
  getCurrentItinerary: () => ItineraryData | null;
  setCurrentItinerary: (itinerary: ItineraryData) => void;
  
  // Actions
  updateSpot: (
    dayIndex: number,
    spotId: string,
    updates: Partial<TouristSpot>
  ) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  addSpot: (dayIndex: number, spot: TouristSpot) => void;
  reorderSpots: (
    dayIndex: number,
    startIndex: number,
    endIndex: number
  ) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;
}

// useItineraryStoreへの参照を保持するための一時的な実装
let getCurrentItineraryRef: () => ItineraryData | null = () => null;
let setCurrentItineraryRef: (itinerary: ItineraryData) => void = () => {};

export const useSpotStore = create<SpotStore>((set, get) => ({
  // 外部から注入される参照
  getCurrentItinerary: () => getCurrentItineraryRef(),
  setCurrentItinerary: (itinerary) => setCurrentItineraryRef(itinerary),
  
  // スポット更新
  updateSpot: (dayIndex, spotId, updates) => {
    const currentItinerary = get().getCurrentItinerary();
    if (!currentItinerary) return;

    const newSchedule = [...currentItinerary.schedule];
    const oldDaySchedule = newSchedule[dayIndex];

    if (!oldDaySchedule) return;

    const spotIndex = oldDaySchedule.spots.findIndex((s) => s.id === spotId);
    if (spotIndex === -1) return;

    // 新しいspots配列を作成（イミュータブル）
    const newSpots = [...oldDaySchedule.spots];

    // スポット情報を更新
    newSpots[spotIndex] = {
      ...newSpots[spotIndex],
      ...updates,
    };

    // スポット更新後、時刻順にソート
    const sortedSpots = sortSpotsByTime(newSpots);

    // 新しいdayScheduleオブジェクトを作成（イミュータブル）
    newSchedule[dayIndex] = updateDayBudget({
      ...oldDaySchedule,
      spots: sortedSpots,
    });

    const newItinerary = updateItineraryBudget({
      ...currentItinerary,
      schedule: newSchedule,
      updatedAt: new Date(),
    });

    get().setCurrentItinerary(newItinerary);
  },

  // スポット削除
  deleteSpot: (dayIndex, spotId) => {
    const currentItinerary = get().getCurrentItinerary();
    if (!currentItinerary) return;

    const newSchedule = [...currentItinerary.schedule];
    const oldDaySchedule = newSchedule[dayIndex];

    if (!oldDaySchedule) return;

    // 新しいspots配列を作成（イミュータブル）
    const newSpots = oldDaySchedule.spots.filter((s) => s.id !== spotId);

    // 新しいdayScheduleオブジェクトを作成（イミュータブル）
    newSchedule[dayIndex] = updateDayBudget({
      ...oldDaySchedule,
      spots: newSpots,
    });

    const newItinerary = updateItineraryBudget({
      ...currentItinerary,
      schedule: newSchedule,
      updatedAt: new Date(),
    });

    get().setCurrentItinerary(newItinerary);
  },

  // スポット追加
  addSpot: (dayIndex, spot) => {
    const currentItinerary = get().getCurrentItinerary();
    if (!currentItinerary) return;

    const newSchedule = [...currentItinerary.schedule];
    const oldDaySchedule = newSchedule[dayIndex];

    if (!oldDaySchedule) return;

    // 新しいspots配列を作成（イミュータブル）
    const newSpots = [...oldDaySchedule.spots, spot];

    // スポット追加後、時刻順にソート
    const sortedSpots = sortSpotsByTime(newSpots);

    // 新しいdayScheduleオブジェクトを作成（イミュータブル）
    newSchedule[dayIndex] = updateDayBudget({
      ...oldDaySchedule,
      spots: sortedSpots,
    });

    const newItinerary = updateItineraryBudget({
      ...currentItinerary,
      schedule: newSchedule,
      updatedAt: new Date(),
    });

    get().setCurrentItinerary(newItinerary);
  },

  // スポット並び替え（同じ日内）
  reorderSpots: (dayIndex, startIndex, endIndex) => {
    const currentItinerary = get().getCurrentItinerary();
    if (!currentItinerary) return;

    const newSchedule = [...currentItinerary.schedule];
    const oldDaySchedule = newSchedule[dayIndex];

    if (!oldDaySchedule) return;

    // 新しいspots配列を作成（イミュータブル）
    const spots = [...oldDaySchedule.spots];
    const [removed] = spots.splice(startIndex, 1);
    spots.splice(endIndex, 0, removed);

    // 並び替え後、移動したスポットの時刻を自動調整
    const adjustedSpots = adjustTimeAfterReorder(spots, endIndex);

    // 新しいdayScheduleオブジェクトを作成（イミュータブル）
    newSchedule[dayIndex] = updateDayBudget({
      ...oldDaySchedule,
      spots: adjustedSpots,
    });

    const newItinerary = updateItineraryBudget({
      ...currentItinerary,
      schedule: newSchedule,
      updatedAt: new Date(),
    });

    get().setCurrentItinerary(newItinerary);
  },

  // スポット移動（異なる日間）
  moveSpot: (fromDayIndex, toDayIndex, spotId) => {
    const currentItinerary = get().getCurrentItinerary();
    if (!currentItinerary) return;

    const newSchedule = [...currentItinerary.schedule];
    const oldFromDay = newSchedule[fromDayIndex];
    const oldToDay = newSchedule[toDayIndex];

    if (!oldFromDay || !oldToDay) return;

    const spotIndex = oldFromDay.spots.findIndex((s) => s.id === spotId);
    if (spotIndex === -1) return;

    // 新しいspots配列を作成（イミュータブル）
    const newFromSpots = [...oldFromDay.spots];
    const [spot] = newFromSpots.splice(spotIndex, 1);

    const newToSpots = [...oldToDay.spots, spot];

    // スポット追加後、移動先の日を時刻順にソート
    const sortedToSpots = sortSpotsByTime(newToSpots);

    // 両方の日を更新
    newSchedule[fromDayIndex] = updateDayBudget({
      ...oldFromDay,
      spots: newFromSpots,
    });

    newSchedule[toDayIndex] = updateDayBudget({
      ...oldToDay,
      spots: sortedToSpots,
    });

    const newItinerary = updateItineraryBudget({
      ...currentItinerary,
      schedule: newSchedule,
      updatedAt: new Date(),
    });

    get().setCurrentItinerary(newItinerary);
  },
}));

// 外部から参照を注入する関数
export const initSpotStore = (
  getCurrentItinerary: () => ItineraryData | null,
  setCurrentItinerary: (itinerary: ItineraryData) => void
) => {
  getCurrentItineraryRef = getCurrentItinerary;
  setCurrentItineraryRef = setCurrentItinerary;
};
