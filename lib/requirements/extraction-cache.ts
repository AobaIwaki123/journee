/**
 * Phase 4.8改善: 情報抽出キャッシュ管理
 * 抽出した情報を効率的にキャッシュして再利用
 */

import type { ChatMessage } from '@/types/chat';
import type { ItineraryData } from '@/types/itinerary';
import type { ExtractionCache } from '../ai/conversation-manager';
import {
  extractDestination,
  extractDuration,
  extractBudget,
  extractTravelers,
  extractInterests,
  extractAreaPreferences,
  extractSpotPreferences,
  extractMealPreferences,
} from './extractors';

/**
 * メッセージから情報を抽出してキャッシュを更新
 */
export function extractInformationFromMessage(
  message: string,
  chatHistory: ChatMessage[],
  currentItinerary?: ItineraryData
): Partial<ExtractionCache> {
  const extracted: Partial<ExtractionCache> = {};
  
  // すべてのメッセージ（履歴 + 新規）を含める
  const allMessages = [...chatHistory, {
    id: 'temp',
    role: 'user' as const,
    content: message,
    timestamp: new Date(),
  }];
  
  // 各抽出関数を実行
  const destination = extractDestination(allMessages, currentItinerary);
  if (destination) {
    extracted.destination = destination;
  }
  
  const duration = extractDuration(allMessages, currentItinerary);
  if (duration) {
    extracted.duration = duration;
  }
  
  const budget = extractBudget(allMessages, currentItinerary);
  if (budget) {
    extracted.budget = budget;
  }
  
  const travelers = extractTravelers(allMessages, currentItinerary);
  if (travelers) {
    extracted.travelers = travelers;
  }
  
  const interests = extractInterests(allMessages, currentItinerary);
  if (interests && interests.length > 0) {
    extracted.interests = interests;
  }
  
  // エリアの希望を抽出
  const areaPreferences = extractAreaPreferences(allMessages, currentItinerary);
  if (areaPreferences && areaPreferences.length > 0) {
    extracted.specificSpots = areaPreferences;
  }
  
  // スポットの希望を抽出
  const spotPreferences = extractSpotPreferences(allMessages, currentItinerary);
  if (spotPreferences && spotPreferences.length > 0) {
    if (!extracted.specificSpots) {
      extracted.specificSpots = [];
    }
    extracted.specificSpots.push(...spotPreferences);
  }
  
  // 食事の希望を抽出
  const mealPreferences = extractMealPreferences(allMessages, currentItinerary);
  if (mealPreferences && mealPreferences.length > 0) {
    extracted.mealPreferences = mealPreferences;
  }
  
  // ペース（のんびり、アクティブなど）を抽出
  const pace = extractPace(message);
  if (pace) {
    extracted.pace = pace;
  }
  
  return extracted;
}

/**
 * ペースを抽出（新規追加）
 */
function extractPace(message: string): string | null {
  const paceKeywords: Record<string, string[]> = {
    'のんびり': ['のんびり', 'ゆっくり', 'リラックス', 'ゆったり'],
    'アクティブ': ['アクティブ', '活発', '積極的', 'たくさん', '忙しい'],
    'バランス': ['バランス', '適度', '普通', '標準'],
  };
  
  for (const [pace, keywords] of Object.entries(paceKeywords)) {
    if (keywords.some(kw => message.includes(kw))) {
      return pace;
    }
  }
  
  return null;
}

/**
 * キャッシュをマージ
 */
export function mergeExtractionCache(
  existing: ExtractionCache,
  newData: Partial<ExtractionCache>
): ExtractionCache {
  return {
    ...existing,
    ...newData,
    // 配列は統合
    interests: newData.interests 
      ? [...(existing.interests || []), ...newData.interests]
          .filter((v, i, arr) => arr.indexOf(v) === i) // 重複除去
      : existing.interests,
    specificSpots: newData.specificSpots
      ? [...(existing.specificSpots || []), ...newData.specificSpots]
          .filter((v, i, arr) => arr.indexOf(v) === i)
      : existing.specificSpots,
    mealPreferences: newData.mealPreferences
      ? [...(existing.mealPreferences || []), ...newData.mealPreferences]
          .filter((v, i, arr) => arr.indexOf(v) === i)
      : existing.mealPreferences,
    lastUpdated: new Date(),
  };
}

/**
 * キャッシュをLocalStorageに保存
 */
export function saveExtractionCache(userId: string, cache: ExtractionCache): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `extraction_cache_${userId}`;
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save extraction cache:', e);
  }
}

/**
 * キャッシュをLocalStorageから読み込み
 */
export function loadExtractionCache(userId: string): ExtractionCache | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `extraction_cache_${userId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const cache = JSON.parse(data);
    // Date型の復元
    if (cache.lastUpdated) {
      cache.lastUpdated = new Date(cache.lastUpdated);
    }
    
    return cache;
  } catch (e) {
    console.error('Failed to load extraction cache:', e);
    return null;
  }
}

/**
 * キャッシュをクリア
 */
export function clearExtractionCache(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `extraction_cache_${userId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear extraction cache:', e);
  }
}

/**
 * キャッシュの有効期限チェック（24時間）
 */
export function isCacheValid(cache: ExtractionCache): boolean {
  if (!cache.lastUpdated) return false;
  
  const now = new Date();
  const diff = now.getTime() - new Date(cache.lastUpdated).getTime();
  const hours = diff / (1000 * 60 * 60);
  
  return hours < 24;
}
