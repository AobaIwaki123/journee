# Phase 4.9: 日程作成処理の並列化 - 設計書

## 📋 概要

骨組み作成後の各日程の詳細化を並列処理し、しおり作成を劇的に高速化します。従来の逐次処理（1日ずつ順番に作成）から、並列処理（複数日を同時に作成）へ移行することで、5日間の旅程を5倍速で生成できるようになります。

**目的**:
- しおり生成時間の大幅短縮（5日の場合、理論上5倍速）
- ユーザー体験の向上（待ち時間の削減）
- リアルタイム感の強化（複数日が同時に埋まっていく様子を表示）

**技術的課題**:
- Gemini APIのレート制限への対応
- 並列リクエストのコスト管理
- エラー時の部分的なデータ整合性

---

## 🎯 主要機能

### 1. バッチ詳細化API
- 複数日の詳細化を一度にリクエスト
- 各日ごとに独立したGemini API呼び出し
- `Promise.allSettled`による並列実行

### 2. マルチストリーミング
- 各日ごとに個別のストリーミング接続
- Server-Sent Eventsで複数チャンネル対応
- 日番号による識別

### 3. リアルタイムUI更新
- 各日の生成状況を個別に表示
- 全体の進捗をプログレスバーで表示
- ストリーミング中のアニメーション

### 4. エラーハンドリング
- 一部の日が失敗しても続行
- 失敗した日の再試行機能
- レート制限への自動対応

---

## 📊 型定義

### types/api.ts に追加

```typescript
/**
 * バッチ日程詳細化リクエスト
 */
export interface BatchDayDetailRequest {
  /** しおりID */
  itineraryId: string;
  
  /** 詳細化する日のリスト */
  days: number[];
  
  /** 現在のしおりデータ */
  currentItinerary: ItineraryData;
  
  /** チャット履歴 */
  chatHistory?: ChatMessage[];
  
  /** 並列数の制限（デフォルト: 3） */
  maxConcurrent?: number;
}

/**
 * 各日の詳細化タスク
 */
export interface DayDetailTask {
  /** 日番号 */
  dayNumber: number;
  
  /** ステータス */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** 進捗（0-100） */
  progress: number;
  
  /** エラーメッセージ */
  error?: string;
  
  /** 生成されたスケジュール */
  schedule?: DaySchedule;
}

/**
 * バッチ日程詳細化レスポンス
 */
export interface BatchDayDetailResponse {
  /** タスクID */
  taskId: string;
  
  /** 各日のタスク状態 */
  tasks: DayDetailTask[];
  
  /** 全体の進捗（0-100） */
  overallProgress: number;
  
  /** 完了した日数 */
  completedDays: number;
  
  /** 総日数 */
  totalDays: number;
}

/**
 * マルチストリーミングチャンク
 */
export interface MultiStreamChunk {
  /** チャンクタイプ */
  type: 'day_update' | 'day_complete' | 'all_complete' | 'error';
  
  /** 日番号 */
  dayNumber?: number;
  
  /** メッセージコンテンツ */
  content?: string;
  
  /** 完成した日のスケジュール */
  schedule?: DaySchedule;
  
  /** エラーメッセージ */
  error?: string;
  
  /** 全体の進捗 */
  overallProgress?: number;
}
```

---

## 🏗 アーキテクチャ

### 並列処理のフロー

```
[ユーザーが「全日程の詳細を作成」をクリック]
    ↓
[QuickActions] バッチ詳細化APIを呼び出し
    ↓
[POST /api/chat/batch-detail-days]
    ↓
    ├─→ [Day 1 Task] Gemini API呼び出し → ストリーミング
    ├─→ [Day 2 Task] Gemini API呼び出し → ストリーミング
    ├─→ [Day 3 Task] Gemini API呼び出し → ストリーミング
    ├─→ [Day 4 Task] Gemini API呼び出し → ストリーミング
    └─→ [Day 5 Task] Gemini API呼び出し → ストリーミング
    ↓
[各ストリームチャンクを受信]
    ↓
[フロントエンド] 各日のUIをリアルタイム更新
    ↓
[全タスク完了] しおりデータをマージ
```

### レート制限対策

```
並列数制御:
- 最大3-5並列に制限
- セマフォパターンで実装

リトライロジック:
- 429エラー時は指数バックオフでリトライ
- 最大3回まで再試行

フォールバック:
- 並列処理が失敗した場合、自動的に逐次処理へ切り替え
```

---

## 🔧 実装詳細

### 4.9.1 並列処理APIの設計

#### バッチ詳細化エンドポイント

**ファイル**: `app/api/chat/batch-detail-days/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { 
  BatchDayDetailRequest, 
  BatchDayDetailResponse,
  MultiStreamChunk 
} from '@/types/api';
import { streamGeminiMessage } from '@/lib/ai/gemini';
import { createDayDetailPrompt } from '@/lib/ai/prompts';

/**
 * POST /api/chat/batch-detail-days
 * 複数日の詳細化を並列処理
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BatchDayDetailRequest;
    const {
      itineraryId,
      days,
      currentItinerary,
      chatHistory = [],
      maxConcurrent = 3,
    } = body;
    
    // バリデーション
    if (!days || days.length === 0) {
      return NextResponse.json(
        { error: 'No days specified' },
        { status: 400 }
      );
    }
    
    // ストリーミングレスポンスを返す
    return handleBatchStreaming(
      days,
      currentItinerary,
      chatHistory,
      maxConcurrent
    );
    
  } catch (error: any) {
    console.error('Batch detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * バッチストリーミング処理
 */
async function handleBatchStreaming(
  days: number[],
  currentItinerary: any,
  chatHistory: any[],
  maxConcurrent: number
) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 並列処理の制御
        const semaphore = new Semaphore(maxConcurrent);
        const tasks = days.map(dayNumber => ({
          dayNumber,
          status: 'pending' as const,
          progress: 0,
        }));
        
        // 各日の処理を並列実行
        const promises = days.map(dayNumber => 
          semaphore.use(async () => {
            try {
              // タスク開始を通知
              sendChunk(controller, encoder, {
                type: 'day_update',
                dayNumber,
                overallProgress: calculateProgress(tasks),
              });
              
              // その日の詳細を生成
              const schedule = await generateDayDetail(
                dayNumber,
                currentItinerary,
                chatHistory,
                controller,
                encoder
              );
              
              // 完了を通知
              sendChunk(controller, encoder, {
                type: 'day_complete',
                dayNumber,
                schedule,
                overallProgress: calculateProgress(tasks),
              });
              
              return { dayNumber, schedule };
              
            } catch (error: any) {
              // エラーを通知
              sendChunk(controller, encoder, {
                type: 'error',
                dayNumber,
                error: error.message,
              });
              
              return { dayNumber, error: error.message };
            }
          })
        );
        
        // すべてのタスクが完了するまで待機
        await Promise.allSettled(promises);
        
        // 全完了を通知
        sendChunk(controller, encoder, {
          type: 'all_complete',
          overallProgress: 100,
        });
        
        controller.close();
        
      } catch (error: any) {
        console.error('Batch streaming error:', error);
        
        sendChunk(controller, encoder, {
          type: 'error',
          error: error.message,
        });
        
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * 各日の詳細を生成
 */
async function generateDayDetail(
  dayNumber: number,
  currentItinerary: any,
  chatHistory: any[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<DaySchedule> {
  // プロンプトを生成
  const prompt = createDayDetailPrompt(currentItinerary, dayNumber);
  
  let fullResponse = '';
  
  // ストリーミングで生成
  for await (const chunk of streamGeminiMessage(
    prompt,
    chatHistory,
    currentItinerary,
    'detailing',
    dayNumber
  )) {
    fullResponse += chunk;
    
    // 進捗を通知
    sendChunk(controller, encoder, {
      type: 'day_update',
      dayNumber,
      content: chunk,
    });
  }
  
  // レスポンスをパース
  const { itineraryData } = parseAIResponse(fullResponse);
  
  if (itineraryData?.schedule?.[dayNumber - 1]) {
    return itineraryData.schedule[dayNumber - 1];
  }
  
  throw new Error(`Failed to generate schedule for day ${dayNumber}`);
}

/**
 * ストリームチャンクを送信
 */
function sendChunk(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  chunk: MultiStreamChunk
) {
  const data = `data: ${JSON.stringify(chunk)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

/**
 * 全体の進捗を計算
 */
function calculateProgress(tasks: any[]): number {
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * セマフォ（並列数制御）
 */
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }
  
  release(): void {
    this.permits++;
    const resolve = this.queue.shift();
    if (resolve) {
      this.permits--;
      resolve();
    }
  }
  
  async use<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
```

---

### 4.9.2 フロントエンドの受信処理

**ファイル**: `lib/utils/batch-api-client.ts`

```typescript
import type { MultiStreamChunk, BatchDayDetailRequest } from '@/types/api';

/**
 * バッチ日程詳細化のストリーミング
 */
export async function* batchDetailDaysStream(
  request: BatchDayDetailRequest
): AsyncGenerator<MultiStreamChunk, void, unknown> {
  const response = await fetch('/api/chat/batch-detail-days', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Batch detail failed: ${response.statusText}`);
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream not supported');
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data.trim()) {
          try {
            const chunk = JSON.parse(data) as MultiStreamChunk;
            yield chunk;
          } catch (error) {
            console.error('Failed to parse chunk:', error);
          }
        }
      }
    }
  }
}
```

---

### 4.9.3 UI表示の更新

**ファイル**: `components/itinerary/DaySchedule.tsx` を拡張

```typescript
'use client';

import React from 'react';
import type { DaySchedule as DayScheduleType } from '@/types/itinerary';
import { Loader2 } from 'lucide-react';

interface DayScheduleProps {
  schedule: DayScheduleType;
  isLoading?: boolean;
  loadingProgress?: number;
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ 
  schedule, 
  isLoading = false,
  loadingProgress = 0,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">
          {schedule.day}日目
          {schedule.title && `: ${schedule.title}`}
        </h3>
        
        {/* ローディング状態 */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{loadingProgress}%</span>
          </div>
        )}
      </div>
      
      {/* プログレスバー（ローディング中のみ） */}
      {isLoading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* スポットリスト */}
      {schedule.spots.length > 0 ? (
        <div className="space-y-3">
          {schedule.spots.map((spot, index) => (
            <SpotCard key={spot.id || index} spot={spot} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          {isLoading ? '詳細を生成中...' : 'スケジュールがまだありません'}
        </div>
      )}
    </div>
  );
};
```

**ファイル**: `components/itinerary/BatchProgressOverlay.tsx`（新規）

```typescript
'use client';

import React from 'react';
import { Loader2, Check, X } from 'lucide-react';
import type { DayDetailTask } from '@/types/api';

interface BatchProgressOverlayProps {
  tasks: DayDetailTask[];
  overallProgress: number;
  onCancel?: () => void;
}

export const BatchProgressOverlay: React.FC<BatchProgressOverlayProps> = ({
  tasks,
  overallProgress,
  onCancel,
}) => {
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        {/* ヘッダー */}
        <div className="mb-4">
          <h3 className="text-lg font-bold">日程の詳細を作成中...</h3>
          <p className="text-sm text-gray-600">
            {completedCount} / {totalCount} 日完了
          </p>
        </div>
        
        {/* 全体のプログレスバー */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="text-right text-sm text-gray-600 mt-1">
            {Math.round(overallProgress)}%
          </div>
        </div>
        
        {/* 各日の状態 */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {tasks.map(task => (
            <div
              key={task.dayNumber}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                {task.status === 'completed' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : task.status === 'failed' ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : task.status === 'processing' ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className="font-medium">{task.dayNumber}日目</span>
              </div>
              
              {task.status === 'processing' && (
                <span className="text-sm text-gray-600">{task.progress}%</span>
              )}
              
              {task.error && (
                <span className="text-xs text-red-500">{task.error}</span>
              )}
            </div>
          ))}
        </div>
        
        {/* キャンセルボタン */}
        {onCancel && overallProgress < 100 && (
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### 4.9.4 QuickActionsでの使用

**ファイル**: `components/itinerary/QuickActions.tsx` に追加

```typescript
import { batchDetailDaysStream } from '@/lib/utils/batch-api-client';
import { BatchProgressOverlay } from './BatchProgressOverlay';

// ... 既存のコード ...

const [batchTasks, setBatchTasks] = useState<DayDetailTask[]>([]);
const [batchProgress, setBatchProgress] = useState(0);
const [showBatchProgress, setShowBatchProgress] = useState(false);

const handleBatchDetailAllDays = async () => {
  if (!currentItinerary || !currentItinerary.schedule) return;
  
  const days = currentItinerary.schedule.map((_, index) => index + 1);
  
  // 初期タスク状態を設定
  const initialTasks: DayDetailTask[] = days.map(day => ({
    dayNumber: day,
    status: 'pending',
    progress: 0,
  }));
  
  setBatchTasks(initialTasks);
  setBatchProgress(0);
  setShowBatchProgress(true);
  
  try {
    // バッチストリーミング開始
    for await (const chunk of batchDetailDaysStream({
      itineraryId: currentItinerary.id,
      days,
      currentItinerary,
      chatHistory: messages.slice(-10),
      maxConcurrent: 3,
    })) {
      if (chunk.type === 'day_update') {
        // 進捗を更新
        setBatchTasks(prev => 
          prev.map(task => 
            task.dayNumber === chunk.dayNumber
              ? { ...task, status: 'processing', progress: chunk.progress || 0 }
              : task
          )
        );
      } else if (chunk.type === 'day_complete') {
        // 日が完了
        setBatchTasks(prev =>
          prev.map(task =>
            task.dayNumber === chunk.dayNumber
              ? { ...task, status: 'completed', progress: 100, schedule: chunk.schedule }
              : task
          )
        );
        
        // しおりを更新
        if (chunk.schedule) {
          const updatedSchedule = [...currentItinerary.schedule];
          updatedSchedule[chunk.dayNumber! - 1] = chunk.schedule;
          
          setItinerary({
            ...currentItinerary,
            schedule: updatedSchedule,
          });
        }
      } else if (chunk.type === 'error') {
        // エラー
        setBatchTasks(prev =>
          prev.map(task =>
            task.dayNumber === chunk.dayNumber
              ? { ...task, status: 'failed', error: chunk.error }
              : task
          )
        );
      } else if (chunk.type === 'all_complete') {
        // 全完了
        setBatchProgress(100);
        setTimeout(() => {
          setShowBatchProgress(false);
        }, 2000);
      }
      
      // 全体の進捗を更新
      if (chunk.overallProgress !== undefined) {
        setBatchProgress(chunk.overallProgress);
      }
    }
  } catch (error: any) {
    console.error('Batch detail error:', error);
    setError(error.message);
    setShowBatchProgress(false);
  }
};

return (
  <>
    {/* ... 既存のUI ... */}
    
    {/* バッチ進捗オーバーレイ */}
    {showBatchProgress && (
      <BatchProgressOverlay
        tasks={batchTasks}
        overallProgress={batchProgress}
        onCancel={() => setShowBatchProgress(false)}
      />
    )}
  </>
);
```

---

## 📈 パフォーマンス最適化

### レート制限対策

```typescript
// リトライロジック付きAPI呼び出し
async function callGeminiWithRetry(
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // 429エラー（レート制限）の場合
      if (error.status === 429 && attempt < maxRetries - 1) {
        // 指数バックオフ
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## 🧪 テスト項目

### 自動テスト
- [ ] セマフォの動作テスト（並列数制御）
- [ ] エラーハンドリングのテスト
- [ ] リトライロジックのテスト
- [ ] ストリームパースのテスト

### 手動テスト
- [ ] 3日間の並列詳細化
- [ ] 5日間の並列詳細化
- [ ] 一部の日が失敗した場合の動作
- [ ] レート制限エラー時のリトライ
- [ ] UIのリアルタイム更新
- [ ] キャンセル機能

---

## 📝 実装優先順位

### Phase 1（基本機能）
1. ✅ 型定義の作成
2. ✅ バッチ詳細化APIの実装
3. ✅ セマフォによる並列数制御
4. ✅ フロントエンドのストリーム受信

### Phase 2（UI強化）
5. ✅ BatchProgressOverlayコンポーネント
6. ✅ DayScheduleのローディング状態
7. ✅ リアルタイム進捗表示

### Phase 3（最適化）
8. ⬜ レート制限対策の強化
9. ⬜ キャッシュ機能
10. ⬜ パフォーマンステスト

---

**実装完了予定**: Phase 4.8の後  
**推定工数**: 4-5日  
**依存関係**: Phase 4.1~4.7の完了

**技術的な注意点**:
- Gemini APIのレート制限を必ず考慮する
- 並列数は3-5に抑える（コスト管理）
- エラーハンドリングを徹底する（部分的な失敗に対応）