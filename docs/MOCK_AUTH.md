# モック認証機能 - ブランチモード

## 概要

ブランチごとの環境でGoogle OAuth認証を回避するためのモック認証機能です。環境変数でモードを切り替えることで、テストユーザーでの自動ログインが可能になります。

## 目的

- ブランチごとのプレビュー環境でGoogle OAuthの設定なしでログイン可能
- 複数のテストユーザーでの動作確認
- 認証フローをバイパスした迅速な開発・テスト

## 有効化方法

### 環境変数の設定

`.env.local`または環境設定に以下を追加：

```bash
# モック認証を有効化
ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

### Kubernetes（ブランチ環境）

`k8s/manifests-multi-deploy/deployment.yml`に以下が既に設定されています：

```yaml
env:
  - name: ENABLE_MOCK_AUTH
    value: "true"
```

### Docker環境

`docker-compose.yml`で`.env.local`を読み込むため、上記の環境変数を設定すればOKです。

## 使用方法

### 1. ログインページへアクセス

モック認証が有効な場合、ログインページ（`/login`）に以下が表示されます：

- 🧪 ブランチモードのバッジ
- テストユーザーでログインボタン
- 注意書き

### 2. テストユーザーでログイン

ボタンをクリックするだけで、自動的にテストユーザーとしてログインされます。

### 3. 複数ユーザーの切り替え（高度な使用）

プログラムから別のテストユーザーを指定する場合：

```typescript
import { signIn } from 'next-auth/react';

// デフォルトユーザー
await signIn('mock', { mockUser: 'default' });

// ユーザー1
await signIn('mock', { mockUser: 'user1' });

// ユーザー2
await signIn('mock', { mockUser: 'user2' });

// 管理者
await signIn('mock', { mockUser: 'admin' });
```

## テストユーザー一覧

### デフォルトユーザー（default）
- **ID**: `mock-user-uuid-12345`
- **Google ID**: `mock-google-id-12345`
- **Email**: `test@example.com`
- **Name**: `テストユーザー`

### ユーザー1（user1）
- **ID**: `mock-user-uuid-11111`
- **Google ID**: `mock-google-id-11111`
- **Email**: `user1@example.com`
- **Name**: `ユーザー1`

### ユーザー2（user2）
- **ID**: `mock-user-uuid-22222`
- **Google ID**: `mock-google-id-22222`
- **Email**: `user2@example.com`
- **Name**: `ユーザー2`

### 管理者（admin）
- **ID**: `mock-user-uuid-99999`
- **Google ID**: `mock-google-id-99999`
- **Email**: `admin@example.com`
- **Name**: `管理者`

## アーキテクチャ

### ファイル構成

```
lib/
├── auth/
│   ├── auth-options.ts          # NextAuth設定（モック認証プロバイダー統合）
│   └── mock-provider.ts         # モック認証プロバイダー（未使用・将来用）
└── mock-data/
    └── mock-users.ts            # モックユーザーデータ定義

components/
└── auth/
    └── LoginButton.tsx          # ログインボタン（モック認証UI）

k8s/
└── manifests-multi-deploy/
    └── deployment.yml           # ブランチ環境設定
```

### 認証フロー

#### 通常モード（`ENABLE_MOCK_AUTH=false`）
```
1. ユーザーがログインボタンをクリック
   ↓
2. Google OAuth認証画面にリダイレクト
   ↓
3. Googleで認証
   ↓
4. コールバック → ユーザー情報取得
   ↓
5. Supabaseにユーザー作成/取得
   ↓
6. JWTトークン生成 → ログイン完了
```

#### モック認証モード（`ENABLE_MOCK_AUTH=true`）
```
1. ユーザーがログインボタンをクリック
   ↓
2. モックユーザーデータを取得
   ↓
3. JWTトークン生成 → ログイン完了（即座）
```

### 実装の仕組み

#### 1. プロバイダーの動的切り替え

`lib/auth/auth-options.ts`:

```typescript
providers: [
  ...(isMockAuthEnabled()
    ? [
        CredentialsProvider({
          id: "mock",
          async authorize(credentials) {
            const mockUser = getMockUser(credentials?.mockUser || "default");
            return mockUser;
          },
        }),
      ]
    : [
        GoogleProvider({ ... }),
      ]),
]
```

#### 2. JWTコールバックの分岐

```typescript
async jwt({ token, user, account }) {
  if (account?.provider === "mock") {
    // モック認証の場合は即座にトークン生成
    token.id = user.id;
    token.googleId = user.googleId;
    return token;
  }
  
  // Google認証の場合はSupabase連携
  if (account?.provider === "google") {
    // Supabaseからユーザー取得...
  }
}
```

#### 3. UIの切り替え

`components/auth/LoginButton.tsx`:

```typescript
const isMockAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";

return (
  <div>
    {!isMockAuthEnabled && <GoogleLoginButton />}
    {isMockAuthEnabled && <MockLoginButton />}
  </div>
);
```

## セキュリティ考慮事項

### ⚠️ 重要な注意事項

1. **本番環境では絶対に無効化**
   ```bash
   # 本番環境
   ENABLE_MOCK_AUTH=false  # または未設定
   ```

2. **公開環境での使用禁止**
   - モック認証が有効な環境は一般公開しない
   - 認証なしでアクセス可能になるため

3. **環境変数の管理**
   - `.env.local`は`.gitignore`に含める
   - 本番環境のシークレットに`ENABLE_MOCK_AUTH`を含めない

### 推奨される使用シナリオ

✅ **OK**:
- ローカル開発環境
- CI/CDのテスト環境
- 社内プレビュー環境（アクセス制限付き）
- ブランチごとの一時的な検証環境

❌ **NG**:
- 本番環境（production）
- ステージング環境（公開されている場合）
- 外部ユーザーがアクセスできる環境

## トラブルシューティング

### モック認証が有効にならない

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `.env.local`に`ENABLE_MOCK_AUTH=true`が設定されているか確認
2. Next.jsサーバーを再起動
3. ブラウザのキャッシュをクリア

```bash
# 再起動
npm run dev
```

### ログインボタンが表示されない

**原因**: クライアント側の環境変数が設定されていない

**解決策**:
```bash
# .env.localに追加
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

`NEXT_PUBLIC_`接頭辞が必要です。

### ログイン後にエラーが出る

**原因**: Supabaseとの連携エラー

**解決策**:
モック認証ではSupabaseへの書き込みを行わないため、一部の機能が制限される場合があります。開発環境では問題ありませんが、データベースが必要な機能をテストする場合は、Supabase接続を確認してください。

### Kubernetesでモック認証が無効

**原因**: Deployment設定に環境変数がない

**解決策**:
`k8s/manifests-multi-deploy/deployment.yml`に以下を追加：

```yaml
env:
  - name: ENABLE_MOCK_AUTH
    value: "true"
```

変更後、再デプロイ：

```bash
kubectl apply -f k8s/manifests-multi-deploy/
```

## カスタマイズ

### 新しいテストユーザーの追加

`lib/mock-data/mock-users.ts`を編集：

```typescript
export const MOCK_USERS: Record<string, MockUser> = {
  // 既存のユーザー...
  
  // 新しいユーザーを追加
  newuser: {
    id: "mock-user-uuid-xxxxx",
    googleId: "mock-google-id-xxxxx",
    email: "newuser@example.com",
    name: "新規ユーザー",
    image: "https://via.placeholder.com/150/00FFFF",
  },
};
```

使用方法：

```typescript
await signIn('mock', { mockUser: 'newuser' });
```

### モックユーザーのデフォルト変更

```typescript
export const DEFAULT_MOCK_USER: MockUser = {
  id: "your-custom-id",
  googleId: "your-custom-google-id",
  email: "custom@example.com",
  name: "カスタムユーザー",
  image: "https://example.com/avatar.jpg",
};
```

## FAQ

### Q: 本番環境で誤って有効化したらどうなる？

A: すべてのユーザーが認証なしでログインできてしまうため、**即座に無効化**してください。

### Q: モック認証と通常認証を同時に有効化できる？

A: いいえ。`ENABLE_MOCK_AUTH=true`の場合、Google OAuth認証は無効化されます。

### Q: データベースへの影響は？

A: モック認証ではSupabaseへのユーザー作成は行われません。既存のデータには影響しません。

### Q: セッションの有効期限は？

A: 通常の認証と同じ30日間です。

### Q: 複数ブラウザで異なるユーザーを使える？

A: はい。各ブラウザで独立してログインできます。

## 参考リンク

- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials)
- [lib/auth/auth-options.ts](../lib/auth/auth-options.ts) - 実装コード
- [lib/mock-data/mock-users.ts](../lib/mock-data/mock-users.ts) - モックユーザーデータ
- [components/auth/LoginButton.tsx](../components/auth/LoginButton.tsx) - UIコンポーネント
- [docs/API.md](./API.md) - API仕様書

## 更新履歴

- **2025-10-09**: 初版作成 - モック認証機能の実装

