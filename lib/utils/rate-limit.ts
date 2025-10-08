/**
 * レート制限ユーティリティ
 */

interface RateLimitConfig {
  limit: number;    // 許可される最大リクエスト数
  window: number;   // 時間枠（ミリ秒）
}

interface RateLimitResult {
  success: boolean;      // リクエストが許可されたか
  remaining: number;     // 残りリクエスト数
  reset: number;         // リセット時刻（Unix timestamp）
  limit: number;         // 最大リクエスト数
}

interface RateLimitEntry {
  requests: number[];    // リクエストのタイムスタンプ配列
  lastCleanup: number;   // 最後のクリーンアップ時刻
}

/**
 * メモリベースのレート制限実装
 * 本番環境では Redis や Upstash を使用することを推奨
 */
class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 定期的なクリーンアップを開始（5分ごと）
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * レート制限をチェック
   */
  async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.window;

    // エントリを取得または作成
    let entry = this.storage.get(identifier);
    if (!entry) {
      entry = {
        requests: [],
        lastCleanup: now
      };
      this.storage.set(identifier, entry);
    }

    // 古いリクエストを削除
    entry.requests = entry.requests.filter(time => time > windowStart);
    entry.lastCleanup = now;

    // リクエスト数をチェック
    if (entry.requests.length >= config.limit) {
      // 最も古いリクエストがリセットされる時刻
      const oldestRequest = entry.requests[0];
      const resetTime = oldestRequest + config.window;

      return {
        success: false,
        remaining: 0,
        reset: resetTime,
        limit: config.limit
      };
    }

    // 新しいリクエストを記録
    entry.requests.push(now);
    this.storage.set(identifier, entry);

    return {
      success: true,
      remaining: config.limit - entry.requests.length,
      reset: now + config.window,
      limit: config.limit
    };
  }

  /**
   * 特定の識別子のレート制限をリセット
   */
  reset(identifier: string): void {
    this.storage.delete(identifier);
  }

  /**
   * すべてのレート制限をクリア
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * 古いエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24時間

    for (const [identifier, entry] of this.storage.entries()) {
      // 24時間以上古いエントリを削除
      if (now - entry.lastCleanup > maxAge) {
        this.storage.delete(identifier);
        continue;
      }

      // リクエストがない場合も削除
      if (entry.requests.length === 0) {
        this.storage.delete(identifier);
      }
    }

    console.log(`[RateLimiter] Cleanup completed. Active entries: ${this.storage.size}`);
  }

  /**
   * 現在のレート制限状態を取得
   */
  getStatus(identifier: string, config: RateLimitConfig): {
    requests: number;
    remaining: number;
    limit: number;
  } {
    const now = Date.now();
    const windowStart = now - config.window;
    
    const entry = this.storage.get(identifier);
    if (!entry) {
      return {
        requests: 0,
        remaining: config.limit,
        limit: config.limit
      };
    }

    const recentRequests = entry.requests.filter(time => time > windowStart);
    
    return {
      requests: recentRequests.length,
      remaining: Math.max(0, config.limit - recentRequests.length),
      limit: config.limit
    };
  }

  /**
   * クリーンアップタイマーを停止
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// シングルトンインスタンス
export const rateLimit = new RateLimiter();

// デフォルト設定
export const DEFAULT_RATE_LIMITS = {
  // フィードバック送信: 1時間に5回
  feedback: {
    limit: 5,
    window: 60 * 60 * 1000 // 1時間
  },
  
  // API一般: 1分間に10回
  api: {
    limit: 10,
    window: 60 * 1000 // 1分
  },
  
  // 厳格な制限: 1分間に3回
  strict: {
    limit: 3,
    window: 60 * 1000 // 1分
  }
} as const;

/**
 * レート制限ヘッダーを生成
 */
export function generateRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * レート制限エラーメッセージを生成
 */
export function generateRateLimitMessage(result: RateLimitResult): string {
  const resetDate = new Date(result.reset);
  const now = new Date();
  const minutesUntilReset = Math.ceil((result.reset - now.getTime()) / 60000);

  if (minutesUntilReset < 1) {
    return 'レート制限に達しました。まもなくリセットされます。';
  } else if (minutesUntilReset < 60) {
    return `レート制限に達しました。約${minutesUntilReset}分後に再度お試しください。`;
  } else {
    return `レート制限に達しました。${resetDate.toLocaleTimeString('ja-JP')}以降に再度お試しください。`;
  }
}

/**
 * IPアドレスまたはユーザーIDから識別子を生成
 */
export function generateIdentifier(ip?: string | null, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  if (ip) {
    return `ip:${ip}`;
  }
  return 'anonymous';
}
