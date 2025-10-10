# ストリーミングメッセージ解析処理

## 📋 目次

1. [概要](#概要)
2. [パーサーの設計思想](#パーサーの設計思想)
3. [抽出パターン定義](#抽出パターン定義)
4. [LINEStreamParser実装](#linestreamparser実装)
5. [バッファリング戦略](#バッファリング戦略)
6. [送信タイミング制御](#送信タイミング制御)
7. [エラーリカバリー](#エラーリカバリー)
8. [テストとデバッグ](#テストとデバッグ)

---

## 概要

Web版では、AIのストリーミング応答をリアルタイムでブラウザに表示しますが、LINE botでは一つずつメッセージを送る必要があります。このドキュメントでは、ストリーミング応答を解析し、適切なタイミングでLINEメッセージとして送信する処理を実装します。

### 課題

- AIの応答は文字列のストリームとして届く
- 観光地、食事、歓楽街などの情報を抽出する必要がある
- 抽出した情報を即座にLINEメッセージとして送信
- パース失敗時のエラーハンドリング

---

## パーサーの設計思想

### 1. イベント駆動アーキテクチャ

```typescript
// コールバック形式で段階的に処理
const parser = new LINEStreamParser({
  onSpotExtracted: async (spot) => {
    // 観光地が抽出されたら即座に処理
  },
  onMealExtracted: async (meal) => {
    // 食事が抽出されたら即座に処理
  },
  onComplete: async (itinerary) => {
    // 完成したしおりを処理
  },
});
```

### 2. バッファリング

```
AIストリーム:  「京都で...」「おすすめ...」「観光地...」「清水寺...」
                ↓         ↓         ↓         ↓
バッファ:      「京都で」 「京都でおすすめ」 「京都でおすすめ観光地」
                                                ↓ パターンマッチ成功
抽出:                                          「清水寺」を抽出
```

### 3. 状態管理

```typescript
enum ParserState {
  IDLE = 'idle',                    // 待機中
  COLLECTING_SPOT = 'collecting_spot',     // 観光地情報収集中
  COLLECTING_MEAL = 'collecting_meal',     // 食事情報収集中
  COLLECTING_ENTERTAINMENT = 'collecting_entertainment', // 歓楽街情報収集中
  BUILDING_SUMMARY = 'building_summary',   // サマリー構築中
}
```

---

## 抽出パターン定義

### AIプロンプトフォーマットの定義

まず、AIに特定のフォーマットで応答させるようプロンプトを調整します。

```typescript
// lib/ai/prompts-line.ts
export function getLineItineraryPrompt(userMessage: string): string {
  return `
あなたは旅行プランナーです。ユーザーの要望に基づいて旅行のしおりを作成してください。

【重要】以下のフォーマットで回答してください：

## 観光地
【観光地】清水寺
説明：京都を代表する歴史的な寺院。清水の舞台からの景色は絶景。
時間：10:00 - 12:00
予算：400円
住所：京都府京都市東山区清水1-294
タグ：寺院,世界遺産,観光名所

【観光地】金閣寺
説明：金箔で覆われた豪華な寺院。池に映る姿が美しい。
時間：13:00 - 14:30
予算：500円
住所：京都府京都市北区金閣寺町1
タグ：寺院,世界遺産,観光名所

## 食事
【食事】京都祇園 萬八
種類：昼食
説明：京懐石の老舗。季節の食材を使った美しい懐石料理が楽しめる。
時間：12:00 - 13:30
予算：5000円/人
住所：京都府京都市東山区祇園町南側570-235
おすすめ：湯豆腐,懐石コース
評価：4.8

## 歓楽街・ナイトスポット
【歓楽街】祇園白川夜桜ライトアップ
カテゴリ：イベント
説明：夜桜が美しいエリア。白川沿いの桜が幻想的にライトアップされる。
時間：18:00 - 21:00
予算：無料
住所：京都府京都市東山区祇園白川エリア
ヒント：混雑するため早めの訪問がおすすめ

ユーザーの要望：
${userMessage}
`;
}
```

### 抽出パターン（正規表現）

```typescript
// lib/line/extraction-patterns.ts

// 観光地パターン
export const TOURIST_SPOT_PATTERN = /【観光地】\s*(.+?)\n説明：(.+?)(?:\n時間：(.+?))?(?:\n予算：(.+?))?(?:\n住所：(.+?))?(?:\n タグ：(.+?))?(?:\n\n|$)/gs;

// 食事パターン
export const MEAL_PATTERN = /【食事】\s*(.+?)\n種類：(.+?)\n説明：(.+?)(?:\n時間：(.+?))?(?:\n予算：(.+?))?(?:\n住所：(.+?))?(?:\nおすすめ：(.+?))?(?:\n評価：(.+?))?(?:\n\n|$)/gs;

// 歓楽街パターン
export const ENTERTAINMENT_PATTERN = /【歓楽街】\s*(.+?)\nカテゴリ：(.+?)\n説明：(.+?)(?:\n時間：(.+?))?(?:\n予算：(.+?))?(?:\n住所：(.+?))?(?:\nヒント：(.+?))?(?:\n\n|$)/gs;

// パターン抽出ヘルパー
export function extractTouristSpot(match: RegExpMatchArray): TouristSpotMessage {
  return {
    type: 'tourist_spot',
    name: match[1]?.trim() || '',
    description: match[2]?.trim() || '',
    time: match[3]?.trim(),
    budget: parseBudget(match[4]),
    location: parseLocation(match[5]),
    tags: match[6]?.split(',').map(t => t.trim()),
  };
}

export function extractMeal(match: RegExpMatchArray): RestaurantMessage {
  const mealTypeMap: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'cafe'> = {
    '朝食': 'breakfast',
    'ランチ': 'lunch',
    '昼食': 'lunch',
    'ディナー': 'dinner',
    '夕食': 'dinner',
    'カフェ': 'cafe',
  };

  return {
    type: 'restaurant',
    name: match[1]?.trim() || '',
    mealType: mealTypeMap[match[2]?.trim()] || 'lunch',
    description: match[3]?.trim() || '',
    time: match[4]?.trim(),
    budget: parseBudget(match[5]),
    location: parseLocation(match[6]),
    mustTryDishes: match[7]?.split(',').map(d => d.trim()),
    rating: match[8] ? parseFloat(match[8]) : undefined,
  };
}

export function extractEntertainment(match: RegExpMatchArray): EntertainmentMessage {
  const categoryMap: Record<string, 'nightlife' | 'shopping' | 'event' | 'nature'> = {
    'ナイトライフ': 'nightlife',
    'ショッピング': 'shopping',
    'イベント': 'event',
    '自然': 'nature',
  };

  return {
    type: 'entertainment',
    name: match[1]?.trim() || '',
    category: categoryMap[match[2]?.trim()] || 'event',
    description: match[3]?.trim() || '',
    time: match[4]?.trim(),
    budget: parseBudget(match[5]),
    location: parseLocation(match[6]),
    tips: match[7]?.trim(),
  };
}

// ユーティリティ関数
function parseBudget(budgetStr?: string): { amount: number; currency: string } | undefined {
  if (!budgetStr) return undefined;
  
  const match = budgetStr.match(/(\d+)円/);
  if (match) {
    return {
      amount: parseInt(match[1], 10),
      currency: 'JPY',
    };
  }
  
  return undefined;
}

function parseLocation(addressStr?: string): { lat: number; lng: number; address: string } | undefined {
  if (!addressStr) return undefined;
  
  // TODO: Google Geocoding API等で緯度経度を取得
  // 現時点では住所のみ
  return {
    lat: 0,
    lng: 0,
    address: addressStr.trim(),
  };
}
```

---

## LINEStreamParser実装

### 基本実装

```typescript
// lib/line/stream-parser.ts
import {
  TOURIST_SPOT_PATTERN,
  MEAL_PATTERN,
  ENTERTAINMENT_PATTERN,
  extractTouristSpot,
  extractMeal,
  extractEntertainment,
} from './extraction-patterns';
import {
  TouristSpotMessage,
  RestaurantMessage,
  EntertainmentMessage,
} from '@/types/line-message';
import { ItineraryData } from '@/types/itinerary';

interface LINEStreamParserCallbacks {
  onSpotExtracted?: (spot: TouristSpotMessage) => Promise<void>;
  onMealExtracted?: (meal: RestaurantMessage) => Promise<void>;
  onEntertainmentExtracted?: (entertainment: EntertainmentMessage) => Promise<void>;
  onComplete?: (itinerary: ItineraryData) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

export class LINEStreamParser {
  private buffer: string = '';
  private callbacks: LINEStreamParserCallbacks;
  private extractedSpots: TouristSpotMessage[] = [];
  private extractedMeals: RestaurantMessage[] = [];
  private extractedEntertainment: EntertainmentMessage[] = [];
  private lastProcessedIndex: number = 0;
  private isFinalized: boolean = false;

  constructor(callbacks: LINEStreamParserCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * ストリームチャンクを追加
   */
  addChunk(chunk: string) {
    if (this.isFinalized) {
      console.warn('Parser is already finalized');
      return;
    }

    this.buffer += chunk;
    this.processBuffer();
  }

  /**
   * バッファを解析して情報を抽出
   */
  private processBuffer() {
    try {
      // 観光地を抽出
      this.extractSpots();
      
      // 食事を抽出
      this.extractMeals();
      
      // 歓楽街を抽出
      this.extractEntertainments();
    } catch (error) {
      console.error('Error processing buffer:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * 観光地を抽出
   */
  private extractSpots() {
    const matches = Array.from(this.buffer.matchAll(TOURIST_SPOT_PATTERN));
    
    // 新しく見つかったマッチのみ処理
    const newMatches = matches.slice(this.extractedSpots.length);
    
    for (const match of newMatches) {
      try {
        const spot = extractTouristSpot(match);
        this.extractedSpots.push(spot);
        
        // コールバックを呼び出し
        this.callbacks.onSpotExtracted?.(spot);
      } catch (error) {
        console.error('Error extracting spot:', error);
      }
    }
  }

  /**
   * 食事を抽出
   */
  private extractMeals() {
    const matches = Array.from(this.buffer.matchAll(MEAL_PATTERN));
    
    const newMatches = matches.slice(this.extractedMeals.length);
    
    for (const match of newMatches) {
      try {
        const meal = extractMeal(match);
        this.extractedMeals.push(meal);
        
        this.callbacks.onMealExtracted?.(meal);
      } catch (error) {
        console.error('Error extracting meal:', error);
      }
    }
  }

  /**
   * 歓楽街を抽出
   */
  private extractEntertainments() {
    const matches = Array.from(this.buffer.matchAll(ENTERTAINMENT_PATTERN));
    
    const newMatches = matches.slice(this.extractedEntertainment.length);
    
    for (const match of newMatches) {
      try {
        const entertainment = extractEntertainment(match);
        this.extractedEntertainment.push(entertainment);
        
        this.callbacks.onEntertainmentExtracted?.(entertainment);
      } catch (error) {
        console.error('Error extracting entertainment:', error);
      }
    }
  }

  /**
   * パース完了処理
   */
  async finalize() {
    if (this.isFinalized) {
      return;
    }

    this.isFinalized = true;

    try {
      // 最終的なバッファ処理
      this.processBuffer();

      // 完全なしおりデータを構築
      const itinerary = this.buildItinerary();

      // コールバックを呼び出し
      await this.callbacks.onComplete?.(itinerary);
    } catch (error) {
      console.error('Error in finalize:', error);
      await this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * 完全なしおりデータを構築
   */
  private buildItinerary(): ItineraryData {
    // 簡易的な実装（実際はより詳細な処理が必要）
    const schedule: DaySchedule[] = [];
    
    // 観光地を日程に割り当て
    // TODO: 時間帯や日数に基づいて適切に分配
    const day1Spots = this.extractedSpots.map((spot) => ({
      id: Math.random().toString(36).substring(7),
      name: spot.name,
      description: spot.description,
      scheduledTime: spot.time,
      budget: spot.budget?.amount,
      location: spot.location,
    }));

    schedule.push({
      day: 1,
      date: new Date().toISOString().split('T')[0],
      spots: day1Spots,
      meals: this.extractedMeals.map((meal) => ({
        id: Math.random().toString(36).substring(7),
        name: meal.name,
        description: meal.description,
        scheduledTime: meal.time,
        budget: meal.budget?.amount,
        location: meal.location,
      })),
    });

    return {
      id: Math.random().toString(36).substring(7),
      title: `旅行プラン`,
      destination: this.extractedSpots[0]?.location?.address || '未設定',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      schedule,
      totalBudget: this.calculateTotalBudget(),
      status: 'completed' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 総予算を計算
   */
  private calculateTotalBudget(): number {
    let total = 0;

    this.extractedSpots.forEach((spot) => {
      if (spot.budget) {
        total += spot.budget.amount;
      }
    });

    this.extractedMeals.forEach((meal) => {
      if (meal.budget) {
        total += meal.budget.amount;
      }
    });

    this.extractedEntertainment.forEach((ent) => {
      if (ent.budget) {
        total += ent.budget.amount;
      }
    });

    return total;
  }

  /**
   * パーサーの状態をリセット
   */
  reset() {
    this.buffer = '';
    this.extractedSpots = [];
    this.extractedMeals = [];
    this.extractedEntertainment = [];
    this.lastProcessedIndex = 0;
    this.isFinalized = false;
  }

  /**
   * 抽出された情報の統計
   */
  getStats() {
    return {
      spots: this.extractedSpots.length,
      meals: this.extractedMeals.length,
      entertainment: this.extractedEntertainment.length,
      bufferSize: this.buffer.length,
    };
  }
}
```

---

## バッファリング戦略

### 1. チャンクサイズの最適化

```typescript
// lib/line/buffering-strategy.ts

export class BufferingStrategy {
  private readonly MIN_CHUNK_SIZE = 100; // 最小チャンクサイズ
  private readonly MAX_BUFFER_SIZE = 10000; // 最大バッファサイズ
  private readonly FLUSH_INTERVAL = 1000; // フラッシュ間隔（ミリ秒）

  private buffer: string = '';
  private lastFlushTime: number = Date.now();

  shouldFlush(): boolean {
    const now = Date.now();
    const timeSinceLastFlush = now - this.lastFlushTime;

    // 条件1: バッファサイズが最大に達した
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      return true;
    }

    // 条件2: 一定時間経過した
    if (timeSinceLastFlush >= this.FLUSH_INTERVAL) {
      return true;
    }

    // 条件3: 完全なパターンが見つかった
    if (this.hasCompletePattern()) {
      return true;
    }

    return false;
  }

  private hasCompletePattern(): boolean {
    // 観光地パターンが完結しているか
    const spotPattern = /【観光地】.+?\n\n/s;
    return spotPattern.test(this.buffer);
  }

  flush() {
    this.lastFlushTime = Date.now();
    const content = this.buffer;
    this.buffer = '';
    return content;
  }
}
```

### 2. メモリ効率化

```typescript
export class MemoryEfficientParser extends LINEStreamParser {
  private readonly MAX_BUFFER_SIZE = 50000; // 50KB

  addChunk(chunk: string) {
    super.addChunk(chunk);

    // バッファサイズが大きくなりすぎた場合
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      // 処理済みの部分を削除
      this.trimBuffer();
    }
  }

  private trimBuffer() {
    // 最後に抽出した位置以降のみ保持
    const lastExtractedIndex = this.findLastExtractedIndex();
    if (lastExtractedIndex > 0) {
      this.buffer = this.buffer.substring(lastExtractedIndex);
    }
  }

  private findLastExtractedIndex(): number {
    // 実装: 最後に抽出した位置を特定
    return 0;
  }
}
```

---

## 送信タイミング制御

### レート制限の考慮

```typescript
// lib/line/message-throttle.ts

export class MessageThrottle {
  private messageQueue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;
  private readonly MESSAGES_PER_SECOND = 5; // LINE APIの制限
  private readonly DELAY_MS = 1000 / this.MESSAGES_PER_SECOND;

  async enqueue(sendFunction: () => Promise<void>) {
    this.messageQueue.push(sendFunction);

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const sendFunction = this.messageQueue.shift();
      if (sendFunction) {
        try {
          await sendFunction();
          
          // レート制限を考慮した遅延
          if (this.messageQueue.length > 0) {
            await this.delay(this.DELAY_MS);
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.messageQueue.length;
  }
}

// 使用例
const throttle = new MessageThrottle();

const parser = new LINEStreamParser({
  onSpotExtracted: async (spot) => {
    await throttle.enqueue(async () => {
      const message = createTouristSpotFlexMessage(spot);
      await lineClient.pushMessage(userId, message);
    });
  },
});
```

---

## エラーリカバリー

### パース失敗時の対応

```typescript
// lib/line/error-recovery.ts

export class ErrorRecoveryParser extends LINEStreamParser {
  private failedChunks: string[] = [];
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;

  addChunk(chunk: string) {
    try {
      super.addChunk(chunk);
      this.retryCount = 0; // 成功したらリセット
    } catch (error) {
      console.error('Parse error:', error);
      
      // 失敗したチャンクを保存
      this.failedChunks.push(chunk);
      
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        // リトライ
        this.retryFailedChunks();
      } else {
        // 最大リトライ回数を超えたらエラーコールバック
        this.callbacks.onError?.(new Error('Max retries exceeded'));
      }
    }
  }

  private async retryFailedChunks() {
    const chunksToRetry = [...this.failedChunks];
    this.failedChunks = [];

    for (const chunk of chunksToRetry) {
      try {
        super.addChunk(chunk);
      } catch (error) {
        this.failedChunks.push(chunk);
      }
    }
  }

  getFailedChunks(): string[] {
    return this.failedChunks;
  }
}
```

### フォールバック処理

```typescript
// パターンマッチ失敗時のフォールバック
export function fallbackExtraction(text: string): TouristSpotMessage[] {
  const spots: TouristSpotMessage[] = [];

  // 簡易的な抽出（パターンマッチ失敗時）
  const lines = text.split('\n');
  let currentSpot: Partial<TouristSpotMessage> | null = null;

  for (const line of lines) {
    // 名前らしき行を検出
    if (line.includes('観光') || line.includes('スポット')) {
      if (currentSpot && currentSpot.name) {
        spots.push(currentSpot as TouristSpotMessage);
      }
      currentSpot = {
        type: 'tourist_spot',
        name: line.trim(),
        description: '',
      };
    }
    // 説明らしき行を検出
    else if (currentSpot && line.trim()) {
      currentSpot.description = (currentSpot.description || '') + line.trim() + ' ';
    }
  }

  if (currentSpot && currentSpot.name) {
    spots.push(currentSpot as TouristSpotMessage);
  }

  return spots;
}
```

---

## テストとデバッグ

### ユニットテスト

```typescript
// lib/line/__tests__/stream-parser.test.ts
import { LINEStreamParser } from '../stream-parser';

describe('LINEStreamParser', () => {
  it('should extract tourist spot correctly', async () => {
    const spots: any[] = [];
    const parser = new LINEStreamParser({
      onSpotExtracted: async (spot) => {
        spots.push(spot);
      },
    });

    const input = `
【観光地】清水寺
説明：京都を代表する歴史的な寺院
時間：10:00 - 12:00
予算：400円
住所：京都府京都市東山区清水1-294
タグ：寺院,世界遺産,観光名所

`;

    parser.addChunk(input);
    await parser.finalize();

    expect(spots).toHaveLength(1);
    expect(spots[0].name).toBe('清水寺');
    expect(spots[0].budget.amount).toBe(400);
  });

  it('should handle streaming chunks', async () => {
    const spots: any[] = [];
    const parser = new LINEStreamParser({
      onSpotExtracted: async (spot) => {
        spots.push(spot);
      },
    });

    // チャンクを分割して追加
    parser.addChunk('【観光地】清');
    parser.addChunk('水寺\n説明：');
    parser.addChunk('京都を代表する');
    parser.addChunk('寺院\n\n');

    await parser.finalize();

    expect(spots).toHaveLength(1);
  });
});
```

### デバッグユーティリティ

```typescript
// lib/line/debug-utils.ts

export class DebugParser extends LINEStreamParser {
  private logs: Array<{ timestamp: number; event: string; data: any }> = [];

  addChunk(chunk: string) {
    this.log('chunk_added', { chunk, bufferSize: this.buffer.length });
    super.addChunk(chunk);
  }

  private log(event: string, data: any) {
    this.logs.push({
      timestamp: Date.now(),
      event,
      data,
    });
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  printStats() {
    console.log('=== Parser Stats ===');
    console.log('Total logs:', this.logs.length);
    console.log('Stats:', this.getStats());
    console.log('Buffer preview:', this.buffer.substring(0, 100));
  }
}

// 使用例
const debugParser = new DebugParser({ /* callbacks */ });
// ... パース処理 ...
debugParser.printStats();
console.log(debugParser.exportLogs());
```

---

## 次のステップ

ストリーミング解析の実装方法を理解したら、次のドキュメントに進んでください：

- **デプロイする**: [07_DEPLOYMENT.md](./07_DEPLOYMENT.md)
- **テストする**: [08_TESTING.md](./08_TESTING.md)

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [05_BACKEND_API.md](./05_BACKEND_API.md), [07_DEPLOYMENT.md](./07_DEPLOYMENT.md)
