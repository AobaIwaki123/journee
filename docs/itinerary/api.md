# API仕様

## エンドポイント一覧

| エンドポイント | メソッド | 認証 | 役割 |
|--------------|---------|------|------|
| `/api/itinerary/save` | POST | 必須 | しおり保存 |
| `/api/itinerary/load` | GET | 必須 | しおり読み込み |
| `/api/itinerary/list` | GET | 必須 | しおり一覧取得 |
| `/api/itinerary/delete` | DELETE | 必須 | しおり削除 |
| `/api/itinerary/publish` | POST | 必須 | しおり公開 |
| `/api/itinerary/unpublish` | POST | 必須 | しおり非公開化 |
| `/api/itinerary/[id]/comments` | GET/POST | 条件付き | コメント管理 |

---

## 1. しおり保存 - `/api/itinerary/save`

**メソッド**: `POST`

**認証**: 必須（NextAuth session）

**リクエストボディ**:
```typescript
{
  itinerary: ItineraryData;
  saveMode: 'overwrite' | 'new';
}
```

**レスポンス（成功）**:
```typescript
{
  success: boolean;
  itineraryId: string;
  message: string;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

**処理フロー**:
1. セッション確認
2. `saveMode` に応じて処理分岐
   - `overwrite`: 既存のしおりを更新
   - `new`: 新規IDを生成して保存
3. Supabase `itineraries` テーブルに保存
4. 成功レスポンスを返却

**使用例**:
```typescript
const response = await fetch('/api/itinerary/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itinerary: currentItinerary,
    saveMode: 'overwrite'
  })
});

const data = await response.json();
console.log(data.message); // 'しおりを保存しました'
```

---

## 2. しおり読み込み - `/api/itinerary/load`

**メソッド**: `GET`

**認証**: 必須

**クエリパラメータ**:
```typescript
{
  id: string;  // しおりID
}
```

**レスポンス（成功）**:
```typescript
{
  itinerary: ItineraryData;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

**使用例**:
```typescript
const response = await fetch('/api/itinerary/load?id=abc123');
const data = await response.json();
setItinerary(data.itinerary);
```

---

## 3. しおり一覧取得 - `/api/itinerary/list`

**メソッド**: `GET`

**認証**: 必須

**クエリパラメータ**:
```typescript
{
  status?: 'draft' | 'completed' | 'archived' | 'all';
  destination?: string;
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'startDate';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
```

**レスポンス（成功）**:
```typescript
{
  itineraries: ItineraryListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**ItineraryListItem型**:
```typescript
interface ItineraryListItem {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
}
```

**使用例**:
```typescript
const params = new URLSearchParams({
  status: 'completed',
  sortBy: 'updatedAt',
  order: 'desc',
  page: '1',
  pageSize: '20'
});

const response = await fetch(`/api/itinerary/list?${params}`);
const data = await response.json();
console.log(data.itineraries); // ItineraryListItem[]
```

---

## 4. しおり削除 - `/api/itinerary/delete`

**メソッド**: `DELETE`

**認証**: 必須

**リクエストボディ**:
```typescript
{
  id: string;
}
```

**レスポンス（成功）**:
```typescript
{
  success: boolean;
  message: string;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

**使用例**:
```typescript
const response = await fetch('/api/itinerary/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'abc123' })
});

const data = await response.json();
console.log(data.message); // 'しおりを削除しました'
```

---

## 5. しおり公開 - `/api/itinerary/publish`

**メソッド**: `POST`

**認証**: 必須

**リクエストボディ**:
```typescript
{
  itineraryId: string;
  settings: {
    isPublic: boolean;
    allowPdfDownload: boolean;
    customMessage?: string;
  };
}
```

**レスポンス（成功）**:
```typescript
{
  success: boolean;
  publicUrl: string;
  slug: string;
  message: string;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

**処理フロー**:
1. ユニークなスラッグ生成（例: `kyoto-trip-2024`）
2. `isPublic = true` に更新
3. `publicSlug`, `publishedAt` を設定
4. 公開URLを返却（例: `https://journee.app/share/kyoto-trip-2024`）

**使用例**:
```typescript
const response = await fetch('/api/itinerary/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itineraryId: 'abc123',
    settings: {
      isPublic: true,
      allowPdfDownload: true,
      customMessage: 'ぜひ参考にしてください！'
    }
  })
});

const data = await response.json();
console.log(data.publicUrl); // 'https://journee.app/share/...'
```

---

## 6. しおり非公開化 - `/api/itinerary/unpublish`

**メソッド**: `POST`

**認証**: 必須

**リクエストボディ**:
```typescript
{
  itineraryId: string;
}
```

**レスポンス（成功）**:
```typescript
{
  success: boolean;
  message: string;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

**処理フロー**:
1. `isPublic = false` に更新
2. `publicSlug` をクリア
3. 公開URLを無効化

**使用例**:
```typescript
const response = await fetch('/api/itinerary/unpublish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ itineraryId: 'abc123' })
});

const data = await response.json();
console.log(data.message); // 'しおりを非公開にしました'
```

---

## 7. コメント管理 - `/api/itinerary/[id]/comments`

**メソッド**: `GET` / `POST` / `DELETE`

**認証**: POST/DELETE は必須、GET は任意

### GET（コメント一覧取得）

**リクエスト**: なし

**レスポンス（成功）**:
```typescript
{
  comments: Comment[];
  count: number;
}
```

**Comment型**:
```typescript
interface Comment {
  id: string;
  itineraryId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### POST（コメント投稿）

**リクエストボディ**:
```typescript
{
  content: string;
}
```

**レスポンス（成功）**:
```typescript
{
  comment: Comment;
  message: string;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

---

### DELETE（コメント削除）

**リクエストボディ**:
```typescript
{
  commentId: string;
}
```

**レスポンス（成功）**:
```typescript
{
  success: boolean;
  message: string;
}
```

**レスポンス（エラー）**:
```typescript
{
  error: string;
}
```

**使用例**:
```typescript
// コメント一覧取得
const response = await fetch('/api/itinerary/abc123/comments');
const data = await response.json();
console.log(data.comments);

// コメント投稿
await fetch('/api/itinerary/abc123/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: '素敵なしおりですね！' })
});

// コメント削除
await fetch('/api/itinerary/abc123/comments', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ commentId: 'comment-123' })
});
```

---

## エラーハンドリング

### 共通エラーレスポンス

```typescript
{
  error: string;        // エラーメッセージ
  code?: string;        // エラーコード（オプション）
  details?: any;        // 詳細情報（オプション）
}
```

### HTTPステータスコード

| コード | 意味 | 使用ケース |
|-------|------|-----------|
| 200 | OK | 成功 |
| 400 | Bad Request | 不正なリクエスト |
| 401 | Unauthorized | 認証が必要 |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソースが見つからない |
| 500 | Internal Server Error | サーバーエラー |

---

## レート制限

**実装予定**: Phase 8以降

- **認証ユーザー**: 100リクエスト/分
- **未認証ユーザー**: 20リクエスト/分

---

**最終更新日**: 2025-01-10

