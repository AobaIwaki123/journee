# モック認証機能

**最終更新**: 2025-10-09

---

## 概要

ブランチごとのプレビュー環境でGoogle OAuth設定なしでログイン可能にする機能です。

---

## 有効化方法

### 環境変数の設定

`.env.local`:
```env
ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

設定後、**必ずビルドしてから実行**:
```bash
npm run build
npm start
```

### Kubernetes環境

`k8s/manifests-*/deployment.yml`:
```yaml
env:
  - name: ENABLE_MOCK_AUTH
    value: "true"
```

GitHub Actionsでイメージビルド時:
```yaml
build-args: |
  NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

---

## 使用方法

### 1. ログイン

モック認証が有効な場合、ログインページ（`/login`）に以下が表示されます：
- 🧪 ブランチモードのバッジ
- テストユーザーでログインボタン

### 2. 初回ログイン処理

ボタンクリックで自動ログイン：
1. モックユーザーデータの取得
2. Supabaseにユーザーが存在するか確認
3. 存在しない場合は自動作成
4. UUIDを取得してセッションに保存

**全機能利用可能** - しおりの保存・公開・削除など

---

## テストユーザー一覧

| ユーザー | Email | Name |
|---------|-------|------|
| **default** | `test@example.com` | テストユーザー |
| **user1** | `user1@example.com` | ユーザー1 |
| **user2** | `user2@example.com` | ユーザー2 |
| **admin** | `admin@example.com` | 管理者 |

---

## セキュリティ考慮事項

### ⚠️ 重要な注意事項

**本番環境では絶対に無効化**:
```env
ENABLE_MOCK_AUTH=false  # または未設定
```

### 推奨される使用シナリオ

✅ **OK**:
- ローカル開発環境
- CI/CDのテスト環境
- 社内プレビュー環境（アクセス制限付き）

❌ **NG**:
- 本番環境（production）
- 公開されたステージング環境
- 外部ユーザーがアクセスできる環境

---

## トラブルシューティング

### モック認証が有効にならない
1. `.env.local`に`ENABLE_MOCK_AUTH=true`を確認
2. Next.jsサーバーを再起動
3. ブラウザのキャッシュをクリア

### ログインボタンが表示されない
- `.env.local`に`NEXT_PUBLIC_ENABLE_MOCK_AUTH=true`を追加

### Kubernetesで無効
1. イメージにビルドされているか確認
2. Deployment設定に環境変数があるか確認
3. `imagePullPolicy: Always`を設定
4. Podを強制再起動: `kubectl rollout restart deployment/journee-* -n journee`

---

## 関連リンク

- [lib/auth/auth-options.ts](../lib/auth/auth-options.ts)
- [lib/mock-data/mock-users.ts](../lib/mock-data/mock-users.ts)
- [components/auth/LoginButton.tsx](../components/auth/LoginButton.tsx)

---

**最終更新**: 2025-10-09
