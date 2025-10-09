# Journee API ドキュメント

このドキュメントでは、Journeeアプリケーションで実装されているAPIエンドポイントについて説明します。

## 📋 目次

- [認証API](#認証api)
- [ユーザーAPI](#ユーザーapi)
- [ヘルスチェックAPI](#ヘルスチェックapi)
- [チャットAPI](#チャットapi)
- [しおりAPI](#しおりapi)
- [コメントAPI](#コメントapi)
- [フィードバックAPI](#フィードバックapi)
- [マイグレーションAPI](#マイグレーションapi)
- [OG画像生成API](#og画像生成api)

---

## 🔐 認証API

NextAuth.jsを使用した認証システム。Google OAuthによるソーシャルログインをサポート。

### ベースURL

```
/api/auth
```

### エンドポイント

#### 1. サインインページ

```http
GET /api/auth/signin
```

Googleログインページを表示します。

**レスポンス**: HTMLページ

---

#### 2. Googleサインイン

```http
POST /api/auth/signin/google
```

Googleアカウントでサインインを開始します。

**認証**: 不要

**レスポンス**: Googleの認証ページにリダイレクト

---

#### 3. サインアウトページ

```http
GET /api/auth/signout
```

サインアウト確認ページを表示します。

**認証**: 必要

**レスポンス**: HTMLページ

---

#### 4. サインアウト実行

```http
POST /api/auth/signout
```

現在のセッションをサインアウトします。

**認証**: 必要

**レスポンス**:
```json
{
  "url": "http://localhost:3000"
}
```

---

#### 5. セッション取得

```http
GET /api/auth/session
```

現在のセッション情報を取得します。

**認証**: 不要（未認証の場合は空のレスポンス）

**レスポンス例（認証済み）**:
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "山田太郎",
    "image": "https://example.com/avatar.jpg",
    "googleId": "google123456"
  },
  "expires": "2024-11-07T12:00:00.000Z"
}
```

**レスポンス例（未認証）**:
```json
{}
```

---

#### 6. CSRFトークン取得

```http
GET /api/auth/csrf
```

CSRF保護用のトークンを取得します。

**認証**: 不要

**レスポンス例**:
```json
{
  "csrfToken": "abc123..."
}
```

---

#### 7. プロバイダー一覧

```http
GET /api/auth/providers
```

利用可能な認証プロバイダーの一覧を取得します。

**認証**: 不要

**レスポンス例**:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "/api/auth/signin/google",
    "callbackUrl": "/api/auth/callback/google"
  }
}
```

---

#### 8. OAuthコールバック

```http
GET /api/auth/callback/google
```

Google OAuthの認証後のコールバックエンドポイント。
自動的にNextAuth.jsが処理します。

**認証**: 不要（OAuth処理中）

---

## 👤 ユーザーAPI

### ベースURL

```
/api/user
```

### エンドポイント

#### 1. 現在のユーザー情報取得

```http
GET /api/user/me
```

現在ログインしているユーザーの情報を取得します。

**認証**: 必要

**レスポンス例（成功）**:
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "山田太郎",
  "image": "https://example.com/avatar.jpg",
  "googleId": "google123456"
}
```

**レスポンス例（未認証）**:
```json
{
  "error": "Unauthorized",
  "message": "ログインが必要です"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `401 Unauthorized`: 未認証
- `500 Internal Server Error`: サーバーエラー

---

## 🏥 ヘルスチェックAPI

### ベースURL

```
/api/health
```

### エンドポイント

#### 1. ヘルスチェック

```http
GET /api/health
```

APIサーバーの状態を確認します。

**認証**: 不要

**レスポンス例**:
```json
{
  "status": "ok",
  "timestamp": "2024-10-07T12:00:00.000Z",
  "service": "Journee API",
  "version": "1.0.0",
  "environment": "development"
}
```

**ステータスコード**:
- `200 OK`: サービス正常

---

## 🔒 認証について

### セッション管理

このAPIはJWT（JSON Web Token）戦略を使用してセッションを管理します。

- **セッション期限**: 30日間
- **トークン保存**: HTTPOnly Cookieに保存
- **自動更新**: セッションアクティビティに応じて自動更新

### 認証が必要なエンドポイント

以下のエンドポイントは認証が必要です：

- `/api/user/*` - ユーザー関連API
- `/api/itinerary/save` - しおり保存
- `/api/itinerary/load` - しおり読込
- `/api/itinerary/list` - しおり一覧
- `/api/itinerary/delete` - しおり削除
- `/api/itinerary/publish` - しおり公開
- `/api/itinerary/unpublish` - しおり非公開化
- `/api/itinerary/[id]/comments/[commentId]` - コメント更新・削除（自分のコメントのみ）
- `/api/migration/*` - マイグレーション関連API

**認証推奨（未認証でも動作可能）**:
- `/api/chat` - チャットAPI（未認証でも使用可能だが、しおりの保存は制限される）
- `/api/itinerary/[id]/comments` - コメント閲覧・投稿（閲覧と匿名投稿は認証不要）

認証が必要なエンドポイントに未認証でアクセスすると、`401 Unauthorized`エラーが返されます。

### クライアント側での認証確認

```typescript
// セッション確認
const response = await fetch('/api/auth/session')
const session = await response.json()

if (session.user) {
  console.log('認証済み:', session.user.email)
} else {
  console.log('未認証')
}
```

---

## 🚀 使用例

### クライアント側（フロントエンド）

#### 認証

```typescript
// ログイン
import { signIn } from 'next-auth/react'
signIn('google')

// ログアウト
import { signOut } from 'next-auth/react'
signOut()

// セッション取得
import { useSession } from 'next-auth/react'

function Component() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>読み込み中...</div>
  if (status === 'unauthenticated') return <div>未認証</div>
  
  return <div>こんにちは、{session.user.name}さん</div>
}
```

#### チャット API

```typescript
// 非ストリーミング
const sendMessage = async (message: string, itinerary?: ItineraryData) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      currentItinerary: itinerary,
      model: 'gemini',
      stream: false,
    }),
  });
  
  const data = await response.json();
  return data;
};

// ストリーミング
const sendMessageStreaming = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      stream: true,
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        switch (data.type) {
          case 'message':
            console.log('Message chunk:', data.content);
            break;
          case 'itinerary':
            console.log('Itinerary:', data.itinerary);
            break;
          case 'done':
            console.log('Streaming complete');
            break;
          case 'error':
            console.error('Error:', data.error);
            break;
        }
      }
    }
  }
};
```

#### しおり API

```typescript
// しおり保存
const saveItinerary = async (itinerary: ItineraryData) => {
  const response = await fetch('/api/itinerary/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itinerary }),
  });
  
  return await response.json();
};

// しおり読込
const loadItinerary = async (id: string) => {
  const response = await fetch(`/api/itinerary/load?id=${id}`);
  return await response.json();
};

// しおり一覧
const listItineraries = async (filters?: {
  status?: string;
  search?: string;
  page?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  
  const response = await fetch(`/api/itinerary/list?${params}`);
  return await response.json();
};

// しおり削除
const deleteItinerary = async (id: string) => {
  const response = await fetch(`/api/itinerary/delete?id=${id}`, {
    method: 'DELETE',
  });
  
  return await response.json();
};

// しおり公開
const publishItinerary = async (
  itineraryId: string,
  settings: PublicItinerarySettings,
  itinerary?: ItineraryData
) => {
  const response = await fetch('/api/itinerary/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itineraryId, settings, itinerary }),
  });
  
  return await response.json();
};

// しおり非公開化
const unpublishItinerary = async (itineraryId: string) => {
  const response = await fetch('/api/itinerary/unpublish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itineraryId }),
  });
  
  return await response.json();
};
```

#### コメント API

```typescript
// コメント一覧取得
const fetchComments = async (itineraryId: string, options?: {
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}) => {
  const params = new URLSearchParams({
    limit: String(options?.limit || 10),
    offset: String(options?.offset || 0),
    sortOrder: options?.sortOrder || 'desc',
  });
  
  const response = await fetch(
    `/api/itinerary/${itineraryId}/comments?${params}`
  );
  return await response.json();
};

// コメント投稿
const postComment = async (
  itineraryId: string,
  content: string,
  authorName: string
) => {
  const response = await fetch(`/api/itinerary/${itineraryId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      authorName,
      isAnonymous: true,
    }),
  });
  
  return await response.json();
};

// コメント更新
const updateComment = async (
  itineraryId: string,
  commentId: string,
  content: string
) => {
  const response = await fetch(
    `/api/itinerary/${itineraryId}/comments/${commentId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  );
  
  return await response.json();
};

// コメント削除
const deleteComment = async (itineraryId: string, commentId: string) => {
  const response = await fetch(
    `/api/itinerary/${itineraryId}/comments/${commentId}`,
    {
      method: 'DELETE',
    }
  );
  
  return await response.json();
};
```

#### フィードバック API

```typescript
// フィードバック送信
const submitFeedback = async (feedback: {
  category: 'bug' | 'enhancement' | 'question';
  title: string;
  description: string;
}) => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...feedback,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }),
  });
  
  return await response.json();
};

// フィードバック機能の状態確認
const checkFeedbackStatus = async () => {
  const response = await fetch('/api/feedback');
  return await response.json();
};
```

#### マイグレーション API

```typescript
// データマイグレーション
const migrateData = async () => {
  const response = await fetch('/api/migration/start', {
    method: 'POST',
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`${result.migratedCount}件のしおりを移行しました`);
  } else {
    console.warn(`${result.migratedCount}件成功、${result.failedCount}件失敗`);
    console.error('エラー:', result.errors);
  }
  
  return result;
};
```

### サーバー側（API Routes / Server Components）

#### セッション取得

```typescript
import { getSession, getCurrentUser } from '@/lib/auth/session'

// Route Handler
export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // セッションを使用した処理
  return Response.json({ message: 'Success' })
}

// ユーザー情報のみ取得
export async function POST() {
  const user = await getCurrentUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
  
  return Response.json({ userId: user.id })
}
```

#### Server Component

```typescript
import { getCurrentUser } from '@/lib/auth/session'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>プロフィール</h1>
      <p>メール: {user.email}</p>
      <p>名前: {user.name}</p>
    </div>
  )
}
```

---

## 📊 エラーハンドリング

### 共通エラーレスポンス

```typescript
interface ApiErrorResponse {
  error: string      // エラーの種類
  message: string    // ユーザー向けメッセージ
  details?: unknown  // 詳細情報（開発環境のみ）
}
```

### ステータスコード

- `200 OK`: 成功
- `201 Created`: リソースの作成成功
- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 認証が必要
- `403 Forbidden`: アクセス権限がない
- `404 Not Found`: リソースが見つからない
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバーエラー
- `503 Service Unavailable`: サービス利用不可

---

## 🧪 テスト方法

### cURLでのテスト

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# セッション取得
curl http://localhost:3000/api/auth/session

# ユーザー情報取得（クッキーが必要）
curl -b cookies.txt http://localhost:3000/api/user/me

# チャット（テストモード）
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","stream":false}'

# しおり一覧（クッキーが必要）
curl -b cookies.txt http://localhost:3000/api/itinerary/list

# しおり保存（クッキーが必要）
curl -X POST http://localhost:3000/api/itinerary/save \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"itinerary":{"id":"test-123","title":"テスト旅程",...}}'

# コメント一覧取得
curl http://localhost:3000/api/itinerary/test-123/comments

# フィードバック送信
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"category":"bug","title":"テストバグ","description":"説明"}'
```

### ブラウザでのテスト

#### 1. 認証テスト
1. ブラウザで `http://localhost:3000/api/auth/signin` にアクセス
2. Googleでログイン
3. デベロッパーツールでCookieを確認
4. `/api/user/me` にアクセスしてユーザー情報を確認

#### 2. チャットAPIテスト
1. ブラウザのコンソールで以下を実行：
```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test', stream: false })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

#### 3. しおりAPIテスト
1. ログイン後、コンソールで以下を実行：
```javascript
// しおり一覧
fetch('/api/itinerary/list')
  .then(res => res.json())
  .then(data => console.log(data));

// しおり保存
fetch('/api/itinerary/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    itinerary: {
      id: 'test-123',
      title: 'テスト旅程',
      destination: '東京',
      startDate: '2025-11-01',
      endDate: '2025-11-03',
      duration: 3,
      schedule: [],
      status: 'draft'
    }
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 💬 チャットAPI

AIとの対話形式でしおりを作成するためのAPI。Gemini 2.5 ProとClaude 3.5 Sonnetに対応。

### ベースURL

```
/api/chat
```

### エンドポイント

#### 1. AIチャット

```http
POST /api/chat
```

ユーザーのメッセージをAIに送信し、レスポンスとしおり情報を取得します。

**認証**: 推奨（未認証でも動作可能だが、保存機能は制限される）

**リクエストボディ**:
```typescript
{
  message: string;                    // ユーザーメッセージ（必須）
  chatHistory?: Message[];            // チャット履歴
  currentItinerary?: ItineraryData;   // 現在のしおりデータ
  model?: 'gemini' | 'claude';        // AIモデル（デフォルト: gemini）
  claudeApiKey?: string;              // Claude使用時のAPIキー
  stream?: boolean;                   // ストリーミング有効化（デフォルト: false）
  planningPhase?: ItineraryPhase;     // 現在の計画フェーズ
  currentDetailingDay?: number;       // 詳細化中の日程番号
  currency?: string;                  // 通貨コード（デフォルト: JPY）
}
```

**レスポンス例（非ストリーミング）**:
```json
{
  "message": "京都2日間の旅程を作成しました！...",
  "itinerary": {
    "id": "itinerary-123",
    "title": "京都2日間の旅",
    "destination": "京都",
    "startDate": "2025-11-01",
    "endDate": "2025-11-02",
    "duration": 2,
    "summary": "古都京都を満喫する2日間の旅程です。",
    "currency": "JPY",
    "schedule": [
      {
        "day": 1,
        "date": "2025-11-01",
        "title": "東山エリアを散策",
        "spots": [
          {
            "id": "spot-1",
            "name": "清水寺",
            "description": "世界遺産に登録されている京都を代表する寺院。",
            "scheduledTime": "09:00",
            "duration": 90,
            "category": "sightseeing",
            "estimatedCost": 400,
            "location": {
              "lat": 34.9949,
              "lng": 135.7850,
              "address": "京都府京都市東山区清水1-294"
            }
          }
        ],
        "totalDistance": 15,
        "totalCost": 2400
      }
    ],
    "totalBudget": 5900,
    "status": "draft"
  },
  "model": "gemini"
}
```

**ストリーミングレスポンス（Server-Sent Events）**:

`stream: true`の場合、`text/event-stream`形式でレスポンスがストリーミングされます。

```typescript
// メッセージチャンク
data: {"type":"message","content":"京都2日間の"}

// しおりデータ
data: {"type":"itinerary","itinerary":{...}}

// 完了通知
data: {"type":"done"}

// エラー
data: {"type":"error","error":"エラーメッセージ"}
```

**特殊コマンド**:
- `test`: テスト用のモックレスポンスを返す
- `次へ`, `next`, `進む`: 次のフェーズへの移行を誘導

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: リクエストが不正
- `500 Internal Server Error`: サーバーエラー

---

## 📝 しおりAPI

しおりの保存・読込・管理を行うAPI。Supabaseデータベースを使用。

### ベースURL

```
/api/itinerary
```

### エンドポイント

#### 1. しおり保存

```http
POST /api/itinerary/save
```

しおりデータをデータベースに保存します。既存のしおりの場合は更新、新規の場合は作成します。

**認証**: 必要

**リクエストボディ**:
```typescript
{
  itinerary: ItineraryData;  // しおりデータ（id必須）
}
```

**レスポンス例（成功）**:
```json
{
  "success": true,
  "itinerary": {
    "id": "itinerary-123",
    "userId": "user-123",
    "title": "京都2日間の旅",
    "updatedAt": "2025-10-09T12:00:00.000Z",
    ...
  },
  "message": "しおりを保存しました"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: しおりデータが不正
- `401 Unauthorized`: 未認証
- `500 Internal Server Error`: サーバーエラー

---

#### 2. しおり読込

```http
GET /api/itinerary/load?id={itineraryId}
```

指定されたIDのしおりを取得します。

**認証**: 必要

**クエリパラメータ**:
- `id` (string, 必須): しおりID

**レスポンス例（成功）**:
```json
{
  "success": true,
  "itinerary": {
    "id": "itinerary-123",
    "userId": "user-123",
    "title": "京都2日間の旅",
    ...
  }
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: IDが未指定
- `401 Unauthorized`: 未認証
- `404 Not Found`: しおりが見つからない
- `500 Internal Server Error`: サーバーエラー

---

#### 3. しおり一覧

```http
GET /api/itinerary/list
```

ユーザーのしおり一覧を取得します。フィルター・ソート・ページネーション対応。

**認証**: 必要

**クエリパラメータ**:
- `status` (string, 任意): ステータスフィルター（draft/completed/archived）
- `destination` (string, 任意): 行き先フィルター
- `search` (string, 任意): タイトル・行き先での検索
- `sortBy` (string, 任意): ソートキー（updated_at/created_at/start_date、デフォルト: updated_at）
- `sortOrder` (string, 任意): ソート順序（asc/desc、デフォルト: desc）
- `page` (number, 任意): ページ番号（デフォルト: 1）
- `pageSize` (number, 任意): 1ページあたりの件数（デフォルト: 20）

**レスポンス例（成功）**:
```json
{
  "success": true,
  "itineraries": [
    {
      "id": "itinerary-123",
      "title": "京都2日間の旅",
      "destination": "京都",
      "startDate": "2025-11-01",
      "duration": 2,
      "status": "draft",
      "createdAt": "2025-10-09T10:00:00.000Z",
      "updatedAt": "2025-10-09T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**ステータスコード**:
- `200 OK`: 成功
- `401 Unauthorized`: 未認証
- `500 Internal Server Error`: サーバーエラー

---

#### 4. しおり削除

```http
DELETE /api/itinerary/delete?id={itineraryId}
```

指定されたIDのしおりを削除します。関連データもカスケード削除されます。

**認証**: 必要

**クエリパラメータ**:
- `id` (string, 必須): しおりID

**レスポンス例（成功）**:
```json
{
  "success": true,
  "message": "しおりを削除しました"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: IDが未指定
- `401 Unauthorized`: 未認証
- `500 Internal Server Error`: サーバーエラー

---

#### 5. しおり公開

```http
POST /api/itinerary/publish
```

しおりを公開し、共有URLを発行します。

**認証**: 必要

**リクエストボディ**:
```typescript
{
  itineraryId: string;               // しおりID
  settings: {
    isPublic: boolean;               // 公開するか
    allowPdfDownload?: boolean;      // PDF ダウンロード許可（デフォルト: true）
    customMessage?: string;          // カスタムメッセージ
  };
  itinerary?: ItineraryData;         // しおりデータ（存在しない場合）
}
```

**レスポンス例（成功）**:
```json
{
  "success": true,
  "publicUrl": "https://journee.app/share/abc123xyz",
  "slug": "abc123xyz",
  "publishedAt": "2025-10-09T12:00:00.000Z",
  "itineraryId": "itinerary-123"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 未認証
- `404 Not Found`: しおりが見つからない（データも提供されていない場合）
- `500 Internal Server Error`: サーバーエラー

---

#### 6. しおり非公開化

```http
POST /api/itinerary/unpublish
```

公開中のしおりを非公開にします。

**認証**: 必要

**リクエストボディ**:
```typescript
{
  itineraryId: string;  // しおりID
}
```

**レスポンス例（成功）**:
```json
{
  "success": true,
  "message": "しおりを非公開にしました"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: しおりIDが未指定
- `401 Unauthorized`: 未認証
- `404 Not Found`: しおりが見つからない
- `500 Internal Server Error`: サーバーエラー

---

## 💬 コメントAPI

公開しおりに対するコメント機能のAPI。認証ユーザー・匿名ユーザーの両方に対応。

### ベースURL

```
/api/itinerary/[id]/comments
```

### エンドポイント

#### 1. コメント一覧取得

```http
GET /api/itinerary/[id]/comments
```

指定されたしおりのコメント一覧を取得します。ページネーション対応。

**認証**: 不要（公開しおりのみ）

**パスパラメータ**:
- `id` (string, 必須): しおりID

**クエリパラメータ**:
- `limit` (number, 任意): 取得件数（1-100、デフォルト: 10）
- `offset` (number, 任意): オフセット（デフォルト: 0）
- `sortOrder` (string, 任意): ソート順（asc/desc、デフォルト: desc）

**レスポンス例（成功）**:
```json
{
  "data": [
    {
      "id": "comment-123",
      "itineraryId": "itinerary-123",
      "userId": "user-456",
      "authorName": "田中太郎",
      "content": "素敵な旅程ですね！",
      "isAnonymous": false,
      "createdAt": "2025-10-09T12:00:00.000Z",
      "updatedAt": "2025-10-09T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: パラメータが不正
- `404 Not Found`: 公開しおりが見つからない
- `500 Internal Server Error`: サーバーエラー

---

#### 2. コメント投稿

```http
POST /api/itinerary/[id]/comments
```

指定されたしおりにコメントを投稿します。認証ユーザー・匿名ユーザーの両方が利用可能。

**認証**: 不要（匿名投稿可能）

**パスパラメータ**:
- `id` (string, 必須): しおりID

**リクエストボディ**:
```typescript
{
  content: string;        // コメント内容（必須、最大500文字）
  authorName: string;     // 投稿者名（必須）
  isAnonymous?: boolean;  // 匿名フラグ（デフォルト: true）
}
```

**レスポンス例（成功）**:
```json
{
  "id": "comment-123",
  "itineraryId": "itinerary-123",
  "userId": null,
  "authorName": "山田花子",
  "content": "参考になりました！",
  "isAnonymous": true,
  "createdAt": "2025-10-09T12:00:00.000Z",
  "updatedAt": "2025-10-09T12:00:00.000Z"
}
```

**ステータスコード**:
- `201 Created`: 成功
- `400 Bad Request`: リクエストが不正
- `404 Not Found`: 公開しおりが見つからない
- `500 Internal Server Error`: サーバーエラー

---

#### 3. コメント更新

```http
PATCH /api/itinerary/[id]/comments/[commentId]
```

自分が投稿したコメントを更新します。

**認証**: 必要（自分のコメントのみ）

**パスパラメータ**:
- `id` (string, 必須): しおりID
- `commentId` (string, 必須): コメントID

**リクエストボディ**:
```typescript
{
  content: string;  // 新しいコメント内容（必須、最大500文字）
}
```

**レスポンス例（成功）**:
```json
{
  "id": "comment-123",
  "itineraryId": "itinerary-123",
  "userId": "user-456",
  "authorName": "田中太郎",
  "content": "更新したコメント内容",
  "isAnonymous": false,
  "createdAt": "2025-10-09T12:00:00.000Z",
  "updatedAt": "2025-10-09T12:30:00.000Z"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: リクエストが不正
- `401 Unauthorized`: 未認証
- `403 Forbidden`: 他人のコメント
- `500 Internal Server Error`: サーバーエラー

---

#### 4. コメント削除

```http
DELETE /api/itinerary/[id]/comments/[commentId]
```

自分が投稿したコメントを削除します。

**認証**: 必要（自分のコメントのみ）

**パスパラメータ**:
- `id` (string, 必須): しおりID
- `commentId` (string, 必須): コメントID

**レスポンス例（成功）**:
```json
{
  "success": true
}
```

**ステータスコード**:
- `200 OK`: 成功
- `401 Unauthorized`: 未認証
- `403 Forbidden`: 他人のコメント
- `500 Internal Server Error`: サーバーエラー

---

## 📣 フィードバックAPI

ユーザーからのフィードバック（バグ報告・機能要望など）を受け付けるAPI。GitHub Issueとして管理。

### ベースURL

```
/api/feedback
```

### エンドポイント

#### 1. フィードバック送信

```http
POST /api/feedback
```

フィードバックを送信し、GitHub Issueを作成します。

**認証**: 不要（匿名送信可能、認証済みユーザーは自動的に情報が付与される）

**リクエストボディ**:
```typescript
{
  category: 'bug' | 'enhancement' | 'question';  // カテゴリ（必須）
  title: string;                                  // タイトル（必須、最大100文字）
  description: string;                            // 詳細（必須、最大2000文字）
  userEmail?: string;                             // メールアドレス（任意）
  userName?: string;                              // 名前（任意）
  userAgent?: string;                             // ブラウザ情報（自動付与推奨）
  url?: string;                                   // 問題が発生したURL（自動付与推奨）
  screenshot?: string;                            // スクリーンショット（Base64、任意）
}
```

**レスポンス例（成功）**:
```json
{
  "success": true,
  "issueUrl": "https://github.com/your-org/journee/issues/123",
  "issueNumber": 123
}
```

**レスポンス例（エラー）**:
```json
{
  "success": false,
  "error": "タイトルは100文字以内で入力してください。"
}
```

**ステータスコード**:
- `201 Created`: 成功
- `400 Bad Request`: リクエストが不正
- `429 Too Many Requests`: レート制限超過（1分に3回まで）
- `500 Internal Server Error`: サーバーエラー
- `503 Service Unavailable`: フィードバック機能が無効

**レート制限**:
- 1ユーザー（またはIP）あたり1分間に3回まで

---

#### 2. フィードバック機能の状態確認

```http
GET /api/feedback
```

フィードバック機能が利用可能かどうかを確認します。

**認証**: 不要

**レスポンス例**:
```json
{
  "configured": true,
  "message": "Feedback system is operational"
}
```

**ステータスコード**:
- `200 OK`: 常に成功

---

## 🔄 マイグレーションAPI

LocalStorageからSupabaseデータベースへのデータ移行API。

### ベースURL

```
/api/migration
```

### エンドポイント

#### 1. マイグレーション開始

```http
POST /api/migration/start
```

LocalStorageに保存されているしおりデータをデータベースに移行します。

**認証**: 必要

**リクエストボディ**: なし（クライアント側でLocalStorageからデータを取得して送信）

**レスポンス例（成功）**:
```json
{
  "success": true,
  "message": "5件のしおりを移行しました",
  "migratedCount": 5,
  "failedCount": 0
}
```

**レスポンス例（部分的に失敗）**:
```json
{
  "success": false,
  "message": "マイグレーションが部分的に失敗しました",
  "migratedCount": 3,
  "failedCount": 2,
  "errors": [
    "itinerary-123: Invalid data format",
    "itinerary-456: Database error"
  ]
}
```

**ステータスコード**:
- `200 OK`: 完全成功
- `207 Multi-Status`: 部分的に失敗
- `401 Unauthorized`: 未認証
- `500 Internal Server Error`: サーバーエラー

---

## 🖼️ OG画像生成API

公開しおりのOpen Graph画像を動的に生成するAPI。

### ベースURL

```
/api/og
```

### エンドポイント

#### 1. OGP画像生成

```http
GET /api/og?slug={slug}
```

指定されたスラッグの公開しおりのOG画像（1200x630px）を生成します。

**認証**: 不要

**クエリパラメータ**:
- `slug` (string, 必須): 公開しおりのスラグ

**レスポンス**: PNG画像（1200x630px）

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: スラッグが未指定
- `404 Not Found`: しおりが見つからない
- `500 Internal Server Error`: 画像生成に失敗

**使用例**:
```html
<!-- HTMLのメタタグ -->
<meta property="og:image" content="https://journee.app/api/og?slug=abc123xyz" />
```

**画像内容**:
- しおりのタイトル
- 目的地
- 日数
- 概要（あれば）
- Journeeブランドロゴ

---

## 🔗 関連リンク

### 公式ドキュメント
- [NextAuth.js ドキュメント](https://next-auth.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)

### プロジェクトドキュメント
- [Journee README](../README.md)
- [開発ガイド](QUICK_START.md)
- [Docker ガイド](DOCKER.md)
- [デプロイメントガイド](GCR_DEPLOYMENT.md)

### セットアップ
- [Google OAuth 設定](https://console.cloud.google.com/)
- [Supabase プロジェクト作成](https://app.supabase.com/)
- [Google AI Studio](https://makersuite.google.com/)
- [GitHub Personal Access Token](https://github.com/settings/tokens)（フィードバック機能用）

---

## 📊 実装ステータス

### ✅ 実装済み（Phase 1-11）
- ✅ 認証システム（Google OAuth）
- ✅ ユーザー管理
- ✅ チャットAPI（Gemini & Claude対応）
- ✅ ストリーミングレスポンス
- ✅ しおり保存・読込・一覧・削除
- ✅ しおり公開・共有機能
- ✅ コメント機能（閲覧・投稿・更新・削除）
- ✅ フィードバック機能（GitHub Issue統合）
- ✅ OG画像動的生成
- ✅ データベース統合（Supabase）
- ✅ データマイグレーション

### 📋 今後の予定
- 📋 リアルタイム共同編集
- 📋 画像アップロード機能
- 📋 通知機能
- 📋 お気に入り機能

---

**最終更新**: 2025年10月9日  
**バージョン**: v1.1.0  
**API仕様書バージョン**: Phase 11 対応版
