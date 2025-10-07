# Journee API ドキュメント

このドキュメントでは、Journeeアプリケーションで実装されているAPIエンドポイントについて説明します。

## 📋 目次

- [認証API](#認証api)
- [ユーザーAPI](#ユーザーapi)
- [ヘルスチェックAPI](#ヘルスチェックapi)

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
- `/api/chat/*` - チャットAPI（Phase 3で実装予定）
- `/api/itinerary/*` - しおりAPI（Phase 4で実装予定）
- `/api/generate-pdf/*` - PDF生成API（Phase 6で実装予定）
- `/api/settings/*` - 設定API（Phase 7で実装予定）

認証が必要なエンドポイントに未認証でアクセスすると、自動的に`/login`にリダイレクトされます。

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

#### ログイン

```typescript
// ログインページへリダイレクト
window.location.href = '/api/auth/signin'

// または next-auth/react を使用
import { signIn } from 'next-auth/react'
signIn('google')
```

#### ログアウト

```typescript
// ログアウト
window.location.href = '/api/auth/signout'

// または next-auth/react を使用
import { signOut } from 'next-auth/react'
signOut()
```

#### セッション取得

```typescript
// fetch APIを使用
const getSession = async () => {
  const response = await fetch('/api/auth/session')
  const session = await response.json()
  return session
}

// next-auth/react を使用（推奨）
import { useSession } from 'next-auth/react'

function Component() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>読み込み中...</div>
  if (status === 'unauthenticated') return <div>未認証</div>
  
  return <div>こんにちは、{session.user.name}さん</div>
}
```

#### ユーザー情報取得

```typescript
const getCurrentUser = async () => {
  const response = await fetch('/api/user/me')
  
  if (!response.ok) {
    throw new Error('ユーザー情報の取得に失敗しました')
  }
  
  const user = await response.json()
  return user
}
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
- `500 Internal Server Error`: サーバーエラー

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
```

### ブラウザでのテスト

1. ブラウザで `http://localhost:3000/api/auth/signin` にアクセス
2. Googleでログイン
3. デベロッパーツールでCookieを確認
4. `/api/user/me` にアクセスしてユーザー情報を確認

---

## 📝 今後の実装予定

### Phase 3: チャットAPI
- `POST /api/chat` - AIとのチャット
- `GET /api/chat/history` - チャット履歴取得

### Phase 4: しおりAPI
- `POST /api/itinerary/save` - しおり保存
- `GET /api/itinerary/load` - しおり読込
- `GET /api/itinerary/list` - しおり一覧

### Phase 6: PDF生成API
- `POST /api/generate-pdf` - PDF生成

### Phase 7: 設定API
- `GET /api/settings` - 設定取得
- `PUT /api/settings` - 設定更新

---

## 🔗 関連リンク

- [NextAuth.js ドキュメント](https://next-auth.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Google OAuth 設定](https://console.cloud.google.com/)
