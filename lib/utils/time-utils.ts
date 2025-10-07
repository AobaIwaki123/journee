/**
 * 時刻ユーティリティ関数
 */

import { TouristSpot } from '@/types/itinerary';

/**
 * HH:mm形式の時刻を分に変換
 */
export const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * 分をHH:mm形式の時刻に変換
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * スポットを時刻順にソート
 */
export const sortSpotsByTime = (spots: TouristSpot[]): TouristSpot[] => {
  return [...spots].sort((a, b) => {
    // 時刻がない場合は元の順序を維持
    if (!a.scheduledTime && !b.scheduledTime) return 0;
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;

    const timeA = timeToMinutes(a.scheduledTime);
    const timeB = timeToMinutes(b.scheduledTime);
    return timeA - timeB;
  });
};

/**
 * スポットの並び替え時に時刻を自動調整
 * 前後のスポットの時刻を参考に、適切な時刻を設定
 */
export const adjustTimeAfterReorder = (
  spots: TouristSpot[],
  movedIndex: number
): TouristSpot[] => {
  const newSpots = [...spots];
  const movedSpot = newSpots[movedIndex];

  // 時刻がないスポットはスキップ
  if (!movedSpot) return newSpots;

  const prevSpot = movedIndex > 0 ? newSpots[movedIndex - 1] : null;
  const nextSpot = movedIndex < newSpots.length - 1 ? newSpots[movedIndex + 1] : null;

  let newScheduledTime: string | undefined = movedSpot.scheduledTime;

  // 前後のスポットに時刻がある場合、その間の時刻を設定
  if (prevSpot?.scheduledTime && nextSpot?.scheduledTime) {
    const prevTime = timeToMinutes(prevSpot.scheduledTime);
    const nextTime = timeToMinutes(nextSpot.scheduledTime);
    const avgTime = Math.floor((prevTime + nextTime) / 2);
    newScheduledTime = minutesToTime(avgTime);
  }
  // 前のスポットのみ時刻がある場合、その後の時刻を設定
  else if (prevSpot?.scheduledTime) {
    const prevTime = timeToMinutes(prevSpot.scheduledTime);
    const duration = prevSpot.duration || 60; // デフォルト60分
    newScheduledTime = minutesToTime(prevTime + duration);
  }
  // 次のスポットのみ時刻がある場合、その前の時刻を設定
  else if (nextSpot?.scheduledTime) {
    const nextTime = timeToMinutes(nextSpot.scheduledTime);
    const duration = movedSpot.duration || 60; // デフォルト60分
    newScheduledTime = minutesToTime(Math.max(0, nextTime - duration));
  }

  // イミュータブルな更新: 新しいオブジェクトを作成
  newSpots[movedIndex] = {
    ...movedSpot,
    scheduledTime: newScheduledTime,
  };

  return newSpots;
};

/**
 * 時刻変更時にスポットを自動的に再配置すべきかチェック
 */
export const shouldReorderByTime = (
  spots: TouristSpot[],
  changedSpotId: string
): { shouldReorder: boolean; newIndex?: number } => {
  const changedSpotIndex = spots.findIndex(s => s.id === changedSpotId);
  if (changedSpotIndex === -1) return { shouldReorder: false };

  const changedSpot = spots[changedSpotIndex];
  if (!changedSpot.scheduledTime) return { shouldReorder: false };

  const changedTime = timeToMinutes(changedSpot.scheduledTime);

  // 前のスポットより早い時刻になった場合
  const prevSpot = changedSpotIndex > 0 ? spots[changedSpotIndex - 1] : null;
  if (prevSpot?.scheduledTime) {
    const prevTime = timeToMinutes(prevSpot.scheduledTime);
    if (changedTime < prevTime) {
      // 適切な位置を探す
      const newIndex = spots.findIndex((s, i) => {
        if (i >= changedSpotIndex) return false;
        return !s.scheduledTime || timeToMinutes(s.scheduledTime) > changedTime;
      });
      return { shouldReorder: true, newIndex: newIndex === -1 ? 0 : newIndex };
    }
  }

  // 次のスポットより遅い時刻になった場合
  const nextSpot = changedSpotIndex < spots.length - 1 ? spots[changedSpotIndex + 1] : null;
  if (nextSpot?.scheduledTime) {
    const nextTime = timeToMinutes(nextSpot.scheduledTime);
    if (changedTime > nextTime) {
      // 適切な位置を探す
      for (let i = changedSpotIndex + 1; i < spots.length; i++) {
        const spot = spots[i];
        if (!spot.scheduledTime || timeToMinutes(spot.scheduledTime) > changedTime) {
          return { shouldReorder: true, newIndex: i };
        }
      }
      return { shouldReorder: true, newIndex: spots.length - 1 };
    }
  }

  return { shouldReorder: false };
};