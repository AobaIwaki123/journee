# Phase 4.9.3 & 4.9.4 実装レポート

## 📋 概要

**実装日**: 2025-10-07  
**実装フェーズ**: Phase 4.9.3 & Phase 4.9.4  
**目的**: 並列日程作成のUI表示とエラーハンドリング強化

---

## 🎯 Phase 4.9.3: UI表示の更新

### 実装内容

#### 1. `DaySchedule`コンポーネントの拡張

**拡張型定義** (`types/itinerary.ts`):
```typescript
export interface DaySchedule {
  // ... 既存のプロパティ
  
  /** Phase 4.9.3: ローディング状態 */
  isLoading?: boolean;
  
  /** Phase 4.9.3: エラー情報 */
  error?: string;
  
  /** Phase 4.9.3: 進捗率（0-100） */
  progress?: number;
}
```

**コンポーネント更新** (`components/itinerary/DaySchedule.tsx`):

**追加機能**:
1. **ローディング表示**
   - ローディングスピナーとプログレスバーを表示
   - 進捗率をリアルタイム更新
   - 青い背景と境界線で強調

2. **エラー表示**
   - エラーメッセージとアラートアイコン
   - 再試行ボタン（`onRetry`コールバック）
   - 赤い背景で警告を明示

3. **条件付きレンダリング**
   - ローディング中・エラー時はスポット表示を隠す
   - 状態に応じた適切なUIを表示

**UIコード例**:
```typescript
{day.isLoading && (
  <div className="ml-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
    <div className="flex items-center justify-center space-x-3">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-900">詳細化中...</p>
        {day.progress !== undefined && day.progress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${day.progress}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-1">{day.progress}%</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

---

#### 2. `BatchProgress`コンポーネントの作成

**新規コンポーネント** (`components/itinerary/BatchProgress.tsx`):

**機能**:
1. **全体進捗バー**
   - 完了率をパーセンテージ表示
   - カラフルなプログレスバー（青 → 緑）
   - エラー時は黄色に変化

2. **日ごとのステータス表示**
   - ✅ 完了した日: 緑のチェックマーク
   - 🔄 処理中の日: 青のスピナー
   - ❌ エラーの日: 赤のアラート

3. **残り時間推定**
   - `estimatedTimeRemaining`で残り時間を表示
   - 「約X分Y秒」形式で表示

4. **完了メッセージ**
   - 成功時: 緑の背景で成功メッセージ
   - 一部失敗時: 黄色の背景で警告

**型定義**:
```typescript
export interface BatchProgressData {
  completedDays: number[];
  processingDays: number[];
  errorDays: number[];
  totalDays: number;
  progressRate: number;
  estimatedTimeRemaining?: number; // 秒
}
```

**使用例**:
```typescript
<BatchProgress 
  progress={{
    completedDays: [1, 2],
    processingDays: [3],
    errorDays: [],
    totalDays: 5,
    progressRate: 40,
    estimatedTimeRemaining: 120
  }}
  onClose={() => console.log('閉じる')}
/>
```

---

## 🛡️ Phase 4.9.4: エラーハンドリングと再試行

### 実装内容

#### 1. タイムアウト処理

**API更新** (`app/api/chat/batch-detail-days/route.ts`):

**機能**:
- デフォルト120秒のタイムアウト
- `Promise.race()`でストリーミングとタイムアウトを競争
- タイムアウト時に適切なエラーメッセージ

**実装コード**:
```typescript
async function processDayDetail(
  day: DayDetailTask,
  request: BatchDayDetailRequest,
  semaphore: Semaphore,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  timeout: number = 120000 // デフォルト120秒
): Promise<{ day: number; success: boolean; error?: string }> {
  // ...
  
  // タイムアウト処理
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
  });
  
  const streamPromise = (async () => {
    // Gemini APIをストリーミングで呼び出し
    for await (const chunk of streamGeminiMessage(...)) {
      // ...
    }
  })();
  
  // タイムアウトとストリーミングをレース
  await Promise.race([streamPromise, timeoutPromise]);
  
  // ...
}
```

---

#### 2. 自動リトライロジック

**機能**:
- 最大2回の再試行（合計3回実行）
- Exponential Backoff（指数バックオフ）
- リトライ可能なエラーを判定
  - タイムアウトエラー
  - レート制限エラー（429）
  - `rate limit`を含むエラー

**リトライ判定**:
```typescript
const isRetryable = retryCount < maxRetries && 
  (error.message?.includes('Timeout') || 
   error.message?.includes('rate limit') ||
   error.message?.includes('429'));

if (isRetryable) {
  retryCount++;
  const waitTime = Math.min(1000 * Math.pow(2, retryCount), 5000);
  // 最大5秒のバックオフ
  await new Promise(resolve => setTimeout(resolve, waitTime));
  continue; // リトライ
}
```

**バックオフ時間**:
- 1回目のリトライ: 2秒（2^1 * 1000ms）
- 2回目のリトライ: 4秒（2^2 * 1000ms）
- 最大5秒に制限

---

#### 3. レート制限対策

**セマフォ**（既存機能）:
```typescript
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise<void>((resolve) => {
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
}
```

**並列数の制御**:
- デフォルト: 最大3並列
- フロントエンドから`maxParallel`を設定可能
- Gemini APIのレート制限を考慮

---

#### 4. 部分的失敗への対応

**機能**:
- 一部の日の詳細化が失敗しても続行
- 失敗した日のエラー情報を保持
- 再試行ボタンで個別に再実行可能

**進捗管理**:
```typescript
let completedDays: number[] = [];
let errorDays: number[] = [];

for (const taskPromise of tasks) {
  const result = await taskPromise;
  
  if (result.success) {
    completedDays.push(result.day);
  } else {
    errorDays.push(result.day);
  }
  
  // 進捗を送信
  const progressChunk: MultiStreamChunk = {
    type: 'progress',
    progress: {
      completedDays,
      processingDays: days
        .map(d => d.day)
        .filter(d => !completedDays.includes(d) && !errorDays.includes(d)),
      errorDays,
      totalDays: days.length,
      progressRate: Math.round((completedDays.length / days.length) * 100),
    },
    timestamp: Date.now(),
  };
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressChunk)}\n\n`));
}
```

---

## 📊 ストリーミングイベント

### イベントタイプ

| イベント | タイミング | データ |
|---------|-----------|-------|
| `day_start` | 日の詳細化開始 | `{ day, timestamp }` |
| `message` | AIメッセージチャンク | `{ day, content }` |
| `itinerary` | しおりデータ更新 | `{ day, itinerary }` |
| `day_complete` | 日の詳細化完了 | `{ day, timestamp }` |
| `day_error` | 日の詳細化エラー | `{ day, error }` |
| `progress` | 全体進捗更新 | `{ progress }` |
| `done` | すべて完了 | `{ progress }` |
| `error` | 致命的エラー | `{ error }` |

---

## 🧪 テストケース

### 1. 正常系

**シナリオ**: 3日間の詳細化を並列実行

**期待動作**:
1. 各日が順次開始される
2. プログレスバーが0% → 33% → 67% → 100%と更新
3. すべての日が完了する
4. 成功メッセージが表示される

---

### 2. タイムアウト

**シナリオ**: 120秒以内に完了しない

**期待動作**:
1. タイムアウトエラーが発生
2. 自動的に再試行（2秒後）
3. 再試行しても失敗した場合、エラー表示
4. 再試行ボタンで手動再試行可能

---

### 3. レート制限

**シナリオ**: Gemini APIがレート制限（429）を返す

**期待動作**:
1. レート制限エラーを検出
2. Exponential Backoffで再試行（2秒 → 4秒）
3. 再試行成功で処理続行

---

### 4. 部分的失敗

**シナリオ**: 5日中2日がエラー

**期待動作**:
1. 3日が正常完了、2日がエラー
2. プログレスバーが100%になる
3. 黄色の警告メッセージ「3日完了、2日エラー」
4. エラーの日に再試行ボタン表示

---

## 📁 変更ファイル

### 新規作成
- `components/itinerary/BatchProgress.tsx` - 全体進捗表示コンポーネント
- `docs/PHASE4_9_3_AND_4_9_4_IMPLEMENTATION.md` - 実装レポート

### 変更
- `types/itinerary.ts` - `DaySchedule`型にローディング状態を追加
- `types/api.ts` - `BatchDayDetailRequest`にタイムアウトパラメータを追加
- `components/itinerary/DaySchedule.tsx` - ローディング・エラー表示を追加
- `app/api/chat/batch-detail-days/route.ts` - タイムアウトとリトライ処理を追加

---

## 🚀 期待される効果

### ユーザー体験
1. **リアルタイムフィードバック**
   - 各日の詳細化状況を視覚的に把握
   - プログレスバーで全体の進捗を確認

2. **エラー対応**
   - タイムアウトやレート制限を自動的に再試行
   - 失敗した日を手動で再試行可能

3. **高速化**
   - 並列処理で5日の場合、最大5倍速
   - セマフォでレート制限を適切に回避

### 技術的メリット
1. **堅牢性**
   - Exponential Backoffで高い成功率
   - 部分的失敗でも続行可能

2. **可視性**
   - すべてのステータスをストリーミングで通知
   - デバッグが容易

3. **拡張性**
   - タイムアウト時間を調整可能
   - 並列数を動的に変更可能

---

## 🔄 次のステップ

### Phase 4.9.5: キャッシュと最適化
- [ ] レスポンスキャッシュの実装
- [ ] トークン使用量の最適化
- [ ] LocalStorageまたはメモリキャッシュ

### Phase 4.10: 一気通貫作成モード
- [ ] 自動進行トリガーシステム
- [ ] 全工程実行エンジン
- [ ] PhaseStatusBarコンポーネント

---

**実装完了**: Phase 4.9.3 & 4.9.4  
**次の実装**: Phase 4.9.5 または Phase 4.10

**関連ドキュメント**:
- [Phase 4.9 設計書](./PHASE4_9_PARALLEL_DAY_CREATION.md)
- [Phase 4 全体計画](./PHASE4_INCREMENTAL_PLANNING.md)