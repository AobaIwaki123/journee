# ユーティリティ関数一覧

## A. ストレージ関連（`lib/utils/storage.ts`）

### しおり保存・読み込み

```typescript
// LocalStorageへのしおり保存
export function saveCurrentItinerary(itinerary: ItineraryData): boolean

// LocalStorageからのしおり読み込み
export function loadCurrentItinerary(): ItineraryData | null

// LocalStorageのしおりクリア
export function clearCurrentItinerary(): void

// 公開しおり保存
export function savePublicItinerary(
  slug: string, 
  itinerary: ItineraryData
): void

// 公開しおり削除
export function removePublicItinerary(slug: string): void
```

### 設定の保存・読み込み

```typescript
// APIキー保存
export function saveClaudeApiKey(key: string): void
export function loadClaudeApiKey(): string
export function removeClaudeApiKey(): void

// AI選択保存
export function saveSelectedAI(ai: AIModelId): void
export function loadSelectedAI(): AIModelId

// アプリ設定保存
export function saveAppSettings(settings: AppSettings): void
export function loadAppSettings(): AppSettings

// チャットパネル幅保存
export function saveChatPanelWidth(width: number): void
export function loadChatPanelWidth(): number
```

---

## B. PDF生成（`lib/utils/pdf-generator.ts`）

```typescript
interface PDFGenerationOptions {
  filename?: string;
  quality?: number;      // 0.0 - 1.0
  margin?: number;       // mm
  format?: 'a4' | 'letter';
  onProgress?: (progress: number) => void;
}

interface PDFGenerationResult {
  success: boolean;
  filename?: string;
  blob?: Blob;
  error?: string;
}

// メイン生成関数
export async function generateItineraryPDF(
  containerId: string,
  options?: PDFGenerationOptions
): Promise<PDFGenerationResult>

// ファイル名生成
export function generateFilename(itinerary: ItineraryData): string
// 例: "京都旅行_2024-01-01.pdf"
```

**使用例**:
```typescript
const result = await generateItineraryPDF('pdf-container', {
  quality: 0.95,
  margin: 10,
  onProgress: (p) => setProgress(p)
});

if (result.success) {
  console.log('PDF saved:', result.filename);
}
```

---

## C. 予算計算（`lib/utils/budget-utils.ts`）

```typescript
// 1日の総予算を計算
export function calculateDayBudget(spots: TouristSpot[]): number

// 日程の予算を更新
export function updateDayBudget(day: DaySchedule): DaySchedule

// しおり全体の予算を更新
export function updateItineraryBudget(
  itinerary: ItineraryData
): ItineraryData

// 通貨フォーマット
export function formatCurrency(
  amount: number, 
  currency: string = 'JPY'
): string
```

**使用例**:
```typescript
const spots = [
  { estimatedCost: 1000, ... },
  { estimatedCost: 500, ... }
];

const totalCost = calculateDayBudget(spots); // 1500

const formatted = formatCurrency(1500, 'JPY'); // "¥1,500"
```

---

## D. 時間管理（`lib/utils/time-utils.ts`）

```typescript
// スポットを時刻順にソート
export function sortSpotsByTime(spots: TouristSpot[]): TouristSpot[]

// 並び替え後に時刻を自動調整
export function adjustTimeAfterReorder(
  spots: TouristSpot[],
  startTime: string = '09:00'
): TouristSpot[]

// 時刻文字列をパース
export function parseTime(timeStr: string): { hour: number; minute: number }

// 時刻を加算
export function addMinutes(timeStr: string, minutes: number): string
```

**使用例**:
```typescript
// スポットの時刻を自動調整
const adjusted = adjustTimeAfterReorder([
  { scheduledTime: '10:00', duration: 60, ... },
  { scheduledTime: '09:00', duration: 90, ... },
  { scheduledTime: '13:00', duration: 120, ... }
], '09:00');

// 結果:
// spot1: 09:00 (90分)
// spot2: 10:30 (60分)
// spot3: 11:30 (120分)

// 時刻加算
const newTime = addMinutes('09:00', 90); // '10:30'
```

---

## E. 地図関連（`lib/utils/map-utils.ts`）

```typescript
interface MarkerData {
  spot: TouristSpot;
  dayNumber: number;
  spotIndex: number;
}

// マーカーデータ準備
export function prepareMarkerData(
  days: DaySchedule[],
  selectedDay?: number,
  numberingMode?: 'global' | 'perDay'
): MarkerData[]

// 地図の中心座標を計算
export function calculateMapCenter(
  spots: TouristSpot[]
): { lat: number; lng: number }

// 2点間の距離を計算（km）
export function calculateDistance(
  from: Location,
  to: Location
): number
```

**使用例**:
```typescript
// 全スポットのマーカーデータを準備
const markers = prepareMarkerData(days, undefined, 'global');

// 地図の中心を計算
const center = calculateMapCenter(spots);
// { lat: 35.011, lng: 135.768 }

// 距離計算
const distance = calculateDistance(
  { lat: 35.0, lng: 135.0 },
  { lat: 35.1, lng: 135.1 }
); // 約15.7km
```

---

## F. 暗号化（`lib/utils/encryption.ts`）

```typescript
// APIキーの暗号化
export function encryptApiKey(key: string): string

// APIキーの復号化
export function decryptApiKey(encrypted: string): string
```

**使用例**:
```typescript
const apiKey = 'sk-123456789';
const encrypted = encryptApiKey(apiKey);
localStorage.setItem('claudeApiKey', encrypted);

// 復号化
const decrypted = decryptApiKey(encrypted);
console.log(decrypted); // 'sk-123456789'
```

---

## G. 日付フォーマット（`lib/utils/date-utils.ts`）

```typescript
// 日付フォーマット
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'iso' = 'short'
): string

// 日付の差分を計算（日数）
export function dateDiff(start: string, end: string): number

// 曜日を取得
export function getDayOfWeek(dateStr: string): string
```

**使用例**:
```typescript
// フォーマット
formatDate('2024-01-01', 'short');  // '2024/01/01'
formatDate('2024-01-01', 'long');   // '2024年1月1日'
formatDate('2024-01-01', 'iso');    // '2024-01-01'

// 日数計算
const days = dateDiff('2024-01-01', '2024-01-05'); // 4日

// 曜日取得
const day = getDayOfWeek('2024-01-01'); // '月'
```

---

## H. ID生成（`lib/utils/id-generator.ts`）

```typescript
// ユニークIDを生成（UUID v4）
export function generateId(): string

// 短いIDを生成（8文字）
export function generateShortId(): string

// スラッグを生成（URL用）
export function generateSlug(title: string): string
```

**使用例**:
```typescript
// UUID生成
const id = generateId(); 
// 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

// 短いID生成
const shortId = generateShortId(); // 'a1b2c3d4'

// スラッグ生成
const slug = generateSlug('京都 紅葉巡りの旅');
// 'kyoto-kouyou-meguri-no-tabi'
```

---

## I. API クライアント（`lib/utils/api-client.ts`）

```typescript
// チャットメッセージをストリーミング送信
export async function* sendChatMessageStream(
  message: string,
  chatHistory: Message[],
  currentItinerary?: ItineraryData,
  selectedAI?: AIModelId,
  claudeApiKey?: string,
  phase?: ItineraryPhase,
  detailingDay?: number | null
): AsyncGenerator<StreamChunk>

interface StreamChunk {
  type: 'message' | 'itinerary' | 'error' | 'done';
  content?: string;
  itinerary?: ItineraryData;
  error?: string;
}
```

**使用例**:
```typescript
for await (const chunk of sendChatMessageStream(
  'Next',
  chatHistory,
  currentItinerary,
  'gemini',
  null,
  'collecting',
  null
)) {
  if (chunk.type === 'message') {
    appendMessage(chunk.content);
  } else if (chunk.type === 'itinerary') {
    setItinerary(chunk.itinerary);
  }
}
```

---

## まとめ

### カテゴリ別統計
- **ストレージ**: 10関数
- **PDF生成**: 2関数
- **予算計算**: 4関数
- **時間管理**: 4関数
- **地図関連**: 3関数
- **暗号化**: 2関数
- **日付フォーマット**: 3関数
- **ID生成**: 3関数
- **APIクライアント**: 1関数

**合計**: 32関数

---

**最終更新日**: 2025-01-10

