# 認証機能 (Phase 2)

このディレクトリには、NextAuth.jsを使用した認証機能の実装が含まれています。

## 📁 ファイル構成

```
lib/auth/
├── auth-options.ts  # NextAuth設定オプション
├── session.ts       # セッション管理ヘルパー関数
└── README.md        # このファイル
```

## 🔐 実装内容

### 1. NextAuth設定 (`auth-options.ts`)

- **Google OAuth認証**: Googleアカウントでのログイン
- **JWT戦略**: データベース不要のセッション管理
- **セッション期限**: 30日間
- **コールバック関数**:
  - `jwt`: トークンにユーザー情報を追加
  - `session`: セッションにユーザー情報を追加
  - `signIn`: サインイン時のバリデーション
  - `redirect`: 認証後のリダイレクト制御

### 2. セッション管理 (`session.ts`)

サーバーサイドでセッション情報を取得するヘルパー関数を提供：

- `getSession()`: セッション全体を取得
- `getCurrentUser()`: 現在のユーザー情報のみを取得
- `isAuthenticated()`: 認証状態をチェック

## 🚀 使用方法

### Server Components / Route Handlers

```typescript
import { getCurrentUser } from '@/lib/auth/session'

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 認証済みユーザーの処理
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
}
```

### ミドルウェアでの保護

`middleware.ts`で特定のルートを自動的に保護：

```typescript
// /api/chat/* などの保護されたルートにアクセスすると
// 自動的に認証チェックが行われ、未認証の場合は/loginにリダイレクト
```

## 🔑 環境変数

`.env.local`に以下を設定してください：

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のものを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
5. アプリケーションの種類：「ウェブアプリケーション」
6. 承認済みのリダイレクトURIに追加：
   - `http://localhost:3000/api/auth/callback/google`（開発環境）
   - `https://your-domain.com/api/auth/callback/google`（本番環境）
7. クライアントIDとシークレットをコピーして`.env.local`に設定

## 📡 APIエンドポイント

### NextAuth.js 自動生成エンドポイント

- `GET /api/auth/signin` - サインインページ
- `POST /api/auth/signin/google` - Googleでサインイン
- `GET /api/auth/signout` - サインアウトページ
- `POST /api/auth/signout` - サインアウト実行
- `GET /api/auth/callback/google` - OAuthコールバック
- `GET /api/auth/session` - セッション情報取得
- `GET /api/auth/csrf` - CSRFトークン取得
- `GET /api/auth/providers` - プロバイダー一覧取得

### カスタムエンドポイント

- `GET /api/user/me` - 現在のユーザー情報を取得

## 🔒 セキュリティ

- **HTTPS必須**: 本番環境ではHTTPSを使用
- **CSRF保護**: NextAuth.jsが自動的に処理
- **セキュアクッキー**: 本番環境で自動的に有効化
- **メール確認**: Google OAuthでメール確認済みをチェック
- **トークン有効期限**: 30日間のセッション期限

## 🧪 テスト方法

### 1. 開発サーバーを起動

```bash
npm run dev
```

### 2. APIエンドポイントをテスト

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# セッション情報取得（ブラウザでログイン後）
curl http://localhost:3000/api/auth/session

# ユーザー情報取得（認証が必要）
curl http://localhost:3000/api/user/me
```

### 3. ブラウザでテスト

1. `http://localhost:3000/api/auth/signin`にアクセス
2. 「Sign in with Google」をクリック
3. Googleアカウントでログイン
4. リダイレクト後、`/api/user/me`で情報確認

## 📝 今後の実装予定

### Phase 9: データベース統合

現在はJWT戦略を使用していますが、Phase 9でデータベースを統合します：

- ユーザー情報をDBに保存
- セッション管理をDBベースに移行
- ユーザープロファイルの拡張
- アカウント削除機能

### 拡張機能

- [ ] メール/パスワード認証
- [ ] 2要素認証（2FA）
- [ ] ソーシャルログイン（GitHub、Twitter等）
- [ ] パスワードリセット機能
- [ ] アカウント統合機能

## 🐛 トラブルシューティング

### 問題: "Cannot GET /api/auth/signin"

- Next.jsサーバーが起動しているか確認
- `app/api/auth/[...nextauth]/route.ts`が存在するか確認

### 問題: Google OAuth エラー

- `.env.local`の環境変数を確認
- Google Cloud Consoleでリダイレクトが正しく設定されているか確認
- `NEXTAUTH_URL`が正しいドメインを指しているか確認

### 問題: セッションが取得できない

- ブラウザのクッキーが有効か確認
- `NEXTAUTH_SECRET`が設定されているか確認
- 開発環境では `http://localhost:3000` を使用（`127.0.0.1`ではなく）
