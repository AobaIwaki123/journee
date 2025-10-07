import { DaySchedule, ItineraryData, TouristSpot } from '@/types/itinerary';

/**
 * 1日の総予算を計算
 * @param spots その日のスポット配列
 * @returns 総予算（円）
 */
export const calculateDayTotalCost = (spots: TouristSpot[]): number => {
  return spots.reduce((sum, spot) => sum + (spot.estimatedCost || 0), 0);
};

/**
 * しおり全体の総予算を計算
 * @param schedule 全日程の配列
 * @returns 総予算（円）
 */
export const calculateTotalBudget = (schedule: DaySchedule[]): number => {
  return schedule.reduce((sum, day) => sum + (day.totalCost || 0), 0);
};

/**
 * DayScheduleの予算を更新（totalCostを再計算）
 * @param day 更新対象の日程
 * @returns 予算が更新された日程
 */
export const updateDayBudget = (day: DaySchedule): DaySchedule => {
  return {
    ...day,
    totalCost: calculateDayTotalCost(day.spots),
  };
};

/**
 * ItineraryDataの予算を更新（各日のtotalCostとしおり全体のtotalBudgetを再計算）
 * @param itinerary 更新対象のしおり
 * @returns 予算が更新されたしおり
 */
export const updateItineraryBudget = (itinerary: ItineraryData): ItineraryData => {
  // 各日のtotalCostを再計算
  const updatedSchedule = itinerary.schedule.map((day) => updateDayBudget(day));
  
  // しおり全体のtotalBudgetを再計算
  const totalBudget = calculateTotalBudget(updatedSchedule);
  
  return {
    ...itinerary,
    schedule: updatedSchedule,
    totalBudget,
  };
};
