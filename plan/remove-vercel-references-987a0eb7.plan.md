<!-- 987a0eb7-9722-406d-940a-37dd8e91f446 2b07d17f-abb9-4f7a-8379-15eb7d204986 -->
# Vercel関連記述・コード削除

## コード変更

### 1. app/layout.tsx

`VERCEL_URL`環境変数のチェックを削除し、`NEXT_PUBLIC_BASE_URL`のみを使用：

```typescript
// 変更前（lines 6-18）
// metadataBaseの設定: 優先順位
// 1. NEXT_PUBLIC_BASE_URL (環境変数で明示的に指定)
// 2. VERCEL_URL (Vercelの自動デプロイ時)
// 3. http://localhost:3000 (ローカル開発環境)
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

// 変更後
// metadataBaseの設定
// 1. NEXT_PUBLIC_BASE_URL (環境変数で明示的に指定)
// 2. http://localhost:3000 (ローカル開発環境)
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return 'http://localhost:3000';
};
```

### 2. app/share/[slug]/page.tsx

2箇所の`VERCEL_URL`参照を削除（lines 46-50, 153-157付近）：

```typescript
// 変更前
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

// 変更後
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
```

### 3. app/privacy/page.tsx

ホスティングサービスの記述を更新（line 127）：

```typescript
// 変更前
本サービスはVercelでホスティングされています。

// 変更後
本サービスはGoogle Cloud Run/Kubernetesでホスティングされています。
```

## ドキュメント更新

### 4. docs/OGP_DISCORD_LINE.md

- Vercelデプロイコマンド例を削除（line 20-21）
- Vercel環境変数設定セクションを削除（line 29-30）
- HTTPS自動提供の説明からVercelを削除（line 142）

### 5. docs/STORAGE_MIGRATION.md

Vercel環境変数設定例を削除（line 457-459）

### 6. docs/GUIDELINE.md

デプロイ先からVercelを削除（line 35）：

```markdown
// 変更前
Deploy:    Vercel, Google Cloud Run

// 変更後
Deploy:    Google Cloud Run, Kubernetes
```

### 7. docs/METADATA_ENHANCEMENT.md

VERCEL_URLの説明を削除（line 170, 176）

### 8. blog/JOURNEE.md

@vercel/ogへの言及を削除（line 411, 420）

### 9. slides/ISOLATED_BRANCH_ENV/README.md

Vercel自動デプロイの言及を削除（line 205）

### To-dos

- [ ] app/layout.tsxからVERCEL_URL環境変数の処理を削除
- [ ] app/share/[slug]/page.tsxのVERCEL_URL参照を削除（2箇所）
- [ ] app/privacy/page.tsxのホスティングサービス記述を更新
- [ ] docs/OGP_DISCORD_LINE.mdからVercel関連記述を削除
- [ ] docs/STORAGE_MIGRATION.mdからVercel環境変数設定例を削除
- [ ] docs/GUIDELINE.mdのデプロイ先からVercelを削除
- [ ] docs/METADATA_ENHANCEMENT.mdからVERCEL_URLの説明を削除
- [ ] blog/JOURNEE.mdから@vercel/ogの言及を削除
- [ ] slides/ISOLATED_BRANCH_ENV/README.mdからVercel自動デプロイの言及を削除