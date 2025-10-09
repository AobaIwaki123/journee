# モック認証機能 - ブランチモード

**最終更新**: 2025-10-09

---

## 概要

ブランチごとの環境でGoogle OAuth認証を回避するためのモック認証機能です。環境変数でモードを切り替えることで、テストユーザーでの自動ログインが可能になります。

## 目的

- ブランチごとのプレビュー環境でGoogle OAuth設定なしでログイン可能
- 複数のテストユーザーでの動作確認
- 認証フローをバイパスした迅速な開発・テスト
- **全機能の利用**：モックユーザーもSupabaseに登録されるため、すべての機能が利用可能

---

## 有効化方法

### ⚠️ 重要：ビルド時とランタイムの違い

Next.jsの環境変数には2種類あります：

1. **サーバーサイド環境変数**（`ENABLE_MOCK_AUTH`）- 実行時に読み込まれる
2. **クライアントサイド環境変数**（`NEXT_PUBLIC_ENABLE_MOCK_AUTH`）- **ビルド時**にコードに埋め込まれる

### 環境変数の設定

#### ローカル開発環境

`.env.local`:
```bash
# サーバーサイド用（実行時）
ENABLE_MOCK_AUTH=true

# クライアントサイド用（ビルド時）
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

設定後、**必ずビルドしてから実行**：
```bash
npm run build
npm start
# または開発サーバー
npm run dev
```

> **注意**: `npm run dev`では環境変数の変更が即座に反映されますが、本番ビルド（`npm run build`）では再ビルドが必要です。

#### Kubernetes（ブランチ環境）

`k8s/manifests-multi-deploy/deployment.yml`:
```yaml
env:
  - name: ENABLE_MOCK_AUTH
    value: "true"
```

GitHub Actionsでイメージをビルドする際、ビルド引数として設定：
```yaml
build-args: |
  NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

#### Docker環境

`docker-compose.yml`で`.env.local`を読み込むため、上記の環境変数を設定すればOKです。

---

## 使用方法

### 1. ログインページへアクセス

モック認証が有効な場合、ログインページ（`/login`）に以下が表示されます：
- 🧪 ブランチモードのバッジ
- テストユーザーでログインボタン

### 2. テストユーザーでログイン

ボタンをクリックするだけで、自動的にテストユーザーとしてログインされます。

**初回ログイン時の処理**：
1. モックユーザーデータの取得
2. Supabaseにユーザーが存在するか確認
3. 存在しない場合は自動的に作成
4. UUIDを取得してセッションに保存

これにより、しおりの保存・公開・削除などすべての機能が利用可能です。

### 3. 複数ユーザーの切り替え（高度な使用）

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

---

## テストユーザー一覧

| ユーザー | ID | Email | Name |
|---------|-----|-------|------|
| **default** | `mock-user-uuid-12345` | `test@example.com` | テストユーザー |
| **user1** | `mock-user-uuid-11111` | `user1@example.com` | ユーザー1 |
| **user2** | `mock-user-uuid-22222` | `user2@example.com` | ユーザー2 |
| **admin** | `mock-user-uuid-99999` | `admin@example.com` | 管理者 |

---

## アーキテクチャ

### ファイル構成

```
lib/
├── auth/
│   ├── auth-options.ts          # NextAuth設定（モック認証統合）
│   └── mock-provider.ts         # モック認証プロバイダー
└── mock-data/
    └── mock-users.ts            # モックユーザーデータ定義

components/
└── auth/
    └── LoginButton.tsx          # ログインボタン（モック認証UI）

k8s/
└── manifests-multi-deploy/
    └── deployment.yml           # ブランチ環境設定
```

### 認証フロー比較

**通常モード**（`ENABLE_MOCK_AUTH=false`）:
```
ユーザー → Google OAuth → 認証 → Supabase → ログイン
```

**モック認証モード**（`ENABLE_MOCK_AUTH=true`）:
```
ユーザー → モックユーザー取得 → JWTトークン生成 → ログイン（即座）
```

---

## セキュリティ考慮事項

### ⚠️ 重要な注意事項

1. **本番環境では絶対に無効化**
   ```bash
   # 本番環境
   ENABLE_MOCK_AUTH=false  # または未設定
   ```

2. **公開環境での使用禁止** - 認証なしでアクセス可能になるため

3. **環境変数の管理** - `.env.local`は`.gitignore`に含める

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

---

## トラブルシューティング

### モック認証が有効にならない
1. `.env.local`に`ENABLE_MOCK_AUTH=true`が設定されているか確認
2. Next.jsサーバーを再起動
3. ブラウザのキャッシュをクリア

### ログインボタンが表示されない
- `.env.local`に`NEXT_PUBLIC_ENABLE_MOCK_AUTH=true`を追加（`NEXT_PUBLIC_`接頭辞が必要）

### Kubernetesでモック認証が無効

**原因1**: イメージにモック認証がビルドされていない
- `.github/workflows/push.yml`でビルド引数が設定されているか確認
- 新しいイメージをビルド・プッシュ

**原因2**: Deployment設定に環境変数がない
- `k8s/manifests-multi-deploy/deployment.yml`に`ENABLE_MOCK_AUTH=true`を追加
- 再デプロイ: `kubectl apply -f k8s/manifests-multi-deploy/`

**原因3**: 古いイメージがキャッシュされている
- `imagePullPolicy: Always`を設定
- Podを強制再起動: `kubectl rollout restart deployment/journee-multi-deploy -n journee`

---

## カスタマイズ

### モックユーザーの事前登録（オプション）

通常、モックユーザーは初回ログイン時に自動的にSupabaseに作成されますが、事前に一括登録したい場合：

```bash
npm run seed:mock-users
```

### 新しいテストユーザーの追加

`lib/mock-data/mock-users.ts`:
```typescript
export const MOCK_USERS: Record<string, MockUser> = {
  // 既存のユーザー...
  
  newuser: {
    id: "mock-user-uuid-xxxxx",
    googleId: "mock-google-id-xxxxx",
    email: "newuser@example.com",
    name: "新規ユーザー",
    image: "https://via.placeholder.com/150/00FFFF",
  },
};
```

---

## FAQ

### Q: 本番環境で誤って有効化したらどうなる？
A: すべてのユーザーが認証なしでログインできてしまうため、**即座に無効化**してください。

### Q: モック認証と通常認証を同時に有効化できる？
A: いいえ。`ENABLE_MOCK_AUTH=true`の場合、Google OAuth認証は無効化されます。

### Q: データベースへの影響は？
A: モック認証でもSupabaseにユーザーが作成されます。テストユーザー専用のユニークなgoogle_id（`mock-google-id-xxxxx`形式）を持つため、本番ユーザーと競合することはありません。

---

## 参考リンク

- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials)
- [lib/auth/auth-options.ts](../lib/auth/auth-options.ts)
- [lib/mock-data/mock-users.ts](../lib/mock-data/mock-users.ts)
- [components/auth/LoginButton.tsx](../components/auth/LoginButton.tsx)

---

**最終更新**: 2025-10-09
