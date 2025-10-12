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

NextAuth.jsを使用した認証システム。Google OAuthによるソーシャルログイン。

### ベースURL

```
/api/auth
```

### 主要エンドポイント

#### サインイン・サインアウト

```http
GET /api/auth/signin              # ログインページ
POST /api/auth/signin/google      # Googleログイン開始
GET /api/auth/signout             # ログアウトページ
POST /api/auth/signout            # ログアウト実行
```

#### セッション管理

```http
GET /api/auth/session             # セッション情報取得
GET /api/auth/csrf                # CSRFトークン取得
GET /api/auth/providers           # プロバイダー一覧
GET /api/auth/callback/google     # OAuthコールバック
```

**レスポンス例（セッション取得）**:
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

---

## 👤 ユーザーAPI

### 現在のユーザー情報取得

```http
GET /api/user/me
```

**認証**: 必要

**レスポンス例**:
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "山田太郎",
  "image": "https://example.com/avatar.jpg",
  "googleId": "google123456"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `401 Unauthorized`: 未認証

---

## 🏥 ヘルスチェックAPI

### ヘルスチェック

```http
GET /api/health
```

**認証**: 不要

**レスポンス例**:
```json
{
  "status": "ok",
  "timestamp": "2024-10-07T12:00:00.000Z",
  "service": "Journee API",
  "version": "1.0.0"
}
```

---

## 🔒 認証について

### セッション管理

- **セッション期限**: 30日間
- **トークン保存**: HTTPOnly Cookie
- **自動更新**: アクティビティに応じて更新

### 認証が必要なエンドポイント

- `/api/user/*` - ユーザー関連
- `/api/itinerary/save`, `/api/itinerary/load`, `/api/itinerary/list`, `/api/itinerary/delete`
- `/api/itinerary/publish`, `/api/itinerary/unpublish`
- `/api/itinerary/[id]/comments/[commentId]` (PATCH/DELETE: 自分のコメントのみ)
- `/api/migration/*`

**認証推奨（未認証でも動作）**:
- `/api/chat` - チャット（未認証でも利用可能）
- `/api/itinerary/[id]/comments` (GET/POST: 閲覧・匿名投稿可能)

---

## 💬 チャットAPI

AIとの対話形式でしおりを作成。Gemini 2.5 ProとClaude 3.5 Sonnet対応。

### AIチャット

```http
POST /api/chat
```

**認証**: 推奨（未認証でも動作）

**リクエストボディ**:
```typescript
{
  message: string;                    // ユーザーメッセージ（必須）
  chatHistory?: Message[];            // チャット履歴
  currentItinerary?: ItineraryData;   // 現在のしおり
  model?: 'gemini' | 'claude';        // AIモデル（デフォルト: gemini）
  claudeApiKey?: string;              // Claude使用時のAPIキー
  stream?: boolean;                   // ストリーミング（デフォルト: false）
  planningPhase?: ItineraryPhase;     // 現在のフェーズ
  currentDetailingDay?: number;       // 詳細化中の日程
  currency?: string;                  // 通貨コード（デフォルト: JPY）
}
```

**レスポンス例（非ストリーミング）**:
```json
{
  "message": "京都2日間の旅程を作成しました！",
  "itinerary": {
    "id": "itinerary-123",
    "title": "京都2日間の旅",
    "destination": "京都",
    "startDate": "2025-11-01",
    "endDate": "2025-11-02",
    "duration": 2,
    "schedule": [
      {
        "day": 1,
        "spots": [
          {
            "id": "spot-1",
            "name": "清水寺",
            "scheduledTime": "09:00",
            "duration": 90,
            "estimatedCost": 400
          }
        ]
      }
    ]
  }
}
```

**ストリーミングレスポンス（Server-Sent Events）**:

`stream: true`の場合、`text/event-stream`形式でレスポンスがストリーミング。

```typescript
data: {"type":"message","content":"京都2日間の"}
data: {"type":"itinerary","itinerary":{...}}
data: {"type":"done"}
data: {"type":"error","error":"エラーメッセージ"}
```

**特殊コマンド**:
- `test`: テスト用モックレスポンス
- `次へ`, `next`, `進む`: 次フェーズへの移行誘導

---
 
 ## 💬 チャット履歴API
 
 ### チャット履歴保存
 
 **POST /api/chat/history**
 
 ### チャット履歴取得
 
 **GET /api/chat/history?itineraryId={id}**
 
 ### チャット履歴圧縮
 
 **POST /api/chat/compress**
 
 ---
 
 ## 📝 しおりAPI
 
 しおりの保存・読込・管理。Supabaseデータベース使用。

### ベースURL

```
/api/itinerary
```

### エンドポイント一覧

#### 1. しおり保存

```http
POST /api/itinerary/save
```

**認証**: 必要

**リクエスト**:
```typescript
{ itinerary: ItineraryData }
```

**レスポンス**:
```json
{
  "success": true,
  "itinerary": { "id": "itinerary-123", ... },
  "message": "しおりを保存しました"
}
```

---

#### 2. しおり読込

```http
GET /api/itinerary/load?id={itineraryId}
```

**認証**: 必要

**レスポンス**:
```json
{
  "success": true,
  "itinerary": { "id": "itinerary-123", ... }
}
```

---

#### 3. しおり一覧

```http
GET /api/itinerary/list
```

**認証**: 必要

**クエリパラメータ**:
- `status` (string): ステータスフィルター（draft/completed/archived）
- `destination` (string): 行き先フィルター
- `search` (string): タイトル・行き先検索
- `sortBy` (string): ソートキー（updated_at/created_at/start_date、デフォルト: updated_at）
- `sortOrder` (string): ソート順（asc/desc、デフォルト: desc）
- `page` (number): ページ番号（デフォルト: 1）
- `pageSize` (number): 件数/ページ（デフォルト: 20）

**レスポンス**:
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
      "status": "draft"
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

---

#### 4. しおり削除

```http
DELETE /api/itinerary/delete?id={itineraryId}
```

**認証**: 必要

**レスポンス**:
```json
{
  "success": true,
  "message": "しおりを削除しました"
}
```

---

#### 5. しおり公開

```http
POST /api/itinerary/publish
```

**認証**: 必要

**リクエスト**:
```typescript
{
  itineraryId: string;
  settings: {
    isPublic: boolean;
    allowPdfDownload?: boolean;  // デフォルト: true
    customMessage?: string;
  };
  itinerary?: ItineraryData;  // 存在しない場合
}
```

**レスポンス**:
```json
{
  "success": true,
  "publicUrl": "https://journee.app/share/abc123xyz",
  "slug": "abc123xyz",
  "publishedAt": "2025-10-09T12:00:00.000Z"
}
```

---

#### 6. しおり非公開化

```http
POST /api/itinerary/unpublish
```

**認証**: 必要

**リクエスト**:
```typescript
{ itineraryId: string }
```

**レスポンス**:
```json
{
  "success": true,
  "message": "しおりを非公開にしました"
}
```

---

## 💬 コメントAPI

公開しおりへのコメント機能。認証・匿名ユーザー両対応。

### ベースURL

```
/api/itinerary/[id]/comments
```

### エンドポイント

#### 1. コメント一覧取得

```http
GET /api/itinerary/[id]/comments
```

**認証**: 不要（公開しおりのみ）

**クエリパラメータ**:
- `limit` (number): 取得件数（1-100、デフォルト: 10）
- `offset` (number): オフセット（デフォルト: 0）
- `sortOrder` (string): ソート順（asc/desc、デフォルト: desc）

**レスポンス**:
```json
{
  "data": [
    {
      "id": "comment-123",
      "authorName": "田中太郎",
      "content": "素敵なプランですね！",
      "isAnonymous": false,
      "createdAt": "2025-10-09T12:00:00.000Z"
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

---

#### 2. コメント投稿

```http
POST /api/itinerary/[id]/comments
```

**認証**: 不要（匿名投稿可能）

**リクエスト**:
```typescript
{
  content: string;        // 最大500文字
  authorName: string;     // 投稿者名
  isAnonymous?: boolean;  // デフォルト: true
}
```

**レスポンス**:
```json
{
  "id": "comment-123",
  "authorName": "山田花子",
  "content": "参考になりました！",
  "isAnonymous": true,
  "createdAt": "2025-10-09T12:00:00.000Z"
}
```

---

#### 3. コメント更新

```http
PATCH /api/itinerary/[id]/comments/[commentId]
```

**認証**: 必要（自分のコメントのみ）

**リクエスト**:
```typescript
{ content: string }  // 最大500文字
```

---

#### 4. コメント削除

```http
DELETE /api/itinerary/[id]/comments/[commentId]
```

**認証**: 必要（自分のコメントのみ）

**レスポンス**:
```json
{ "success": true }
```

---

## 📣 フィードバックAPI

ユーザーフィードバックをGitHub Issueとして管理。

### ベースURL

```
/api/feedback
```

### フィードバック送信

```http
POST /api/feedback
```

**認証**: 不要（匿名送信可能）

**リクエスト**:
```typescript
{
  category: 'bug' | 'enhancement' | 'question';  // 必須
  title: string;                                  // 最大100文字
  description: string;                            // 最大2000文字
  userEmail?: string;
  userName?: string;
  userAgent?: string;
  url?: string;
  screenshot?: string;  // Base64
}
```

**レスポンス**:
```json
{
  "success": true,
  "issueUrl": "https://github.com/your-org/journee/issues/123",
  "issueNumber": 123
}
```

**レート制限**: 1ユーザー（またはIP）あたり1分間に3回まで

---

## 🔄 マイグレーションAPI

LocalStorage → Supabaseデータ移行。

### マイグレーション開始

```http
POST /api/migration/start
```

**認証**: 必要

**レスポンス**:
```json
{
  "success": true,
  "message": "5件のしおりを移行しました",
  "migratedCount": 5,
  "failedCount": 0
}
```

---

## 🖼️ OG画像生成API

公開しおりのOpen Graph画像を動的生成。

### OGP画像生成

```http
GET /api/og?slug={slug}
```

**認証**: 不要

**レスポンス**: PNG画像（1200x630px）

**使用例**:
```html
<meta property="og:image" content="https://journee.app/api/og?slug=abc123xyz" />
```

---

## 📊 エラーハンドリング

### 共通エラーレスポンス

```typescript
{
  error: string      // エラーの種類
  message: string    // ユーザー向けメッセージ
  details?: unknown  // 詳細（開発環境のみ）
}
```

### ステータスコード

- `200 OK`: 成功
- `201 Created`: リソース作成成功
- `400 Bad Request`: リクエスト不正
- `401 Unauthorized`: 認証必要
- `403 Forbidden`: アクセス権限なし
- `404 Not Found`: リソース未発見
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバーエラー
- `503 Service Unavailable`: サービス利用不可

---

## 🔗 使用例

### クライアント側（フロントエンド）

#### 認証

```typescript
import { signIn, signOut, useSession } from 'next-auth/react'

// ログイン
signIn('google')

// ログアウト
signOut()

// セッション取得
function Component() {
  const { data: session, status } = useSession()
  if (status === 'loading') return <div>読み込み中...</div>
  if (status === 'unauthenticated') return <div>未認証</div>
  return <div>こんにちは、{session.user.name}さん</div>
}
```

#### しおり保存

```typescript
const saveItinerary = async (itinerary: ItineraryData) => {
  const response = await fetch('/api/itinerary/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itinerary }),
  });
  return await response.json();
};
```

#### コメント投稿

```typescript
const postComment = async (itineraryId: string, content: string) => {
  const response = await fetch(`/api/itinerary/${itineraryId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, authorName: '匿名', isAnonymous: true }),
  });
  return await response.json();
};
```

### サーバー側（API Routes / Server Components）

#### セッション取得

```typescript
import { getSession, getCurrentUser } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  return Response.json({ message: 'Success' })
}
```

---

## 🔗 関連リンク

### プロジェクトドキュメント
- [Journee README](../README.md)
- [開発ガイド](QUICK_START.md)
- [Docker ガイド](DOCKER.md)
- [デプロイメントガイド](GCR_DEPLOYMENT.md)

### 公式ドキュメント
- [NextAuth.js](https://next-auth.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

## 📊 実装ステータス

### ✅ 実装済み（Phase 1-11）
- ✅ 認証システム（Google OAuth）
- ✅ ユーザー管理
- ✅ チャットAPI（Gemini & Claude）
- ✅ ストリーミングレスポンス
- ✅ しおり保存・読込・一覧・削除
- ✅ しおり公開・共有
- ✅ コメント機能
- ✅ フィードバック機能（GitHub Issue統合）
- ✅ OG画像動的生成
- ✅ データベース統合（Supabase）
- ✅ データマイグレーション

---

**最終更新**: 2025年10月9日  
**バージョン**: v1.1.0  
**API仕様書バージョン**: Phase 11 対応版
