/**
 * Phase 4.9.5: レスポンスキャッシュ
 * 同じ条件での再生成を防ぐ
 */

import type { ItineraryData } from '@/types/itinerary';
import type { ChatMessage } from '@/types/chat';

/**
 * キャッシュエントリー
 */
interface CacheEntry {
  key: string;
  itinerary: Partial<ItineraryData>;
  timestamp: number;
  expiresAt: number;
}

/**
 * キャッシュキー生成用のパラメータ
 */
interface CacheKeyParams {
  destination?: string;
  duration?: number;
  theme?: string;
  day?: number;
  chatHistoryHash?: string;
}

/**
 * レスポンスキャッシュマネージャー
 */
class ResponseCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 1000 * 60 * 30; // 30分
  private readonly MAX_CACHE_SIZE = 50; // 最大50エントリー
  
  /**
   * キャッシュキーを生成
   */
  generateKey(params: CacheKeyParams): string {
    const parts = [
      params.destination || '',
      params.duration?.toString() || '',
      params.theme || '',
      params.day?.toString() || '',
      params.chatHistoryHash || '',
    ];
    return parts.filter(Boolean).join('|');
  }
  
  /**
   * チャット履歴のハッシュを生成（簡易版）
   */
  hashChatHistory(messages: ChatMessage[]): string {
    // 最新5件のメッセージ内容から簡易ハッシュを生成
    const recentMessages = messages.slice(-5);
    const content = recentMessages.map(m => m.content.slice(0, 50)).join('|');
    return this.simpleHash(content);
  }
  
  /**
   * 簡易ハッシュ関数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * キャッシュに保存
   */
  set(key: string, itinerary: Partial<ItineraryData>, ttl: number = this.DEFAULT_TTL): void {
    // キャッシュサイズ制限チェック
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // 最も古いエントリーを削除
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    const entry: CacheEntry = {
      key,
      itinerary,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * キャッシュから取得
   */
  get(key: string): Partial<ItineraryData> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // 有効期限チェック
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.itinerary;
  }
  
  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 期限切れエントリーを削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * キャッシュ統計を取得
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

/**
 * グローバルキャッシュインスタンス
 */
export const responseCache = new ResponseCacheManager();

/**
 * 定期的にクリーンアップ（5分ごと）
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    responseCache.cleanup();
  }, 1000 * 60 * 5);
}