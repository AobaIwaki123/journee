<!-- cc98e70a-30db-41bd-8513-aaa78dd5f5cc 697836cf-00a5-4a9a-b31d-6018cc207182 -->
# セキュリティリスク修正計画

## 発見されたリスク

### 🔴 Critical: 認証バイパスの脆弱性

**場所**: `middleware.ts`

- HTTPヘッダー `x-test-mode: true` で認証を完全にバイパス可能
- 本番環境でも有効（環境チェックなし）
- 全ての保護されたエンドポイントに影響
- **影響範囲**: `/`, `/api/chat`, `/api/itinerary/*`, `/mypage`, `/settings`

### 🟠 High: チャットAPI認証なし

**場所**: `app/api/chat/route.ts`

- 認証チェックが実装されていない
- 誰でもAI APIを使用可能
- APIコストの不正利用リスク

### 🟡 Medium: Claude APIキーの弱い暗号化

**場所**: `lib/utils/encryption.ts`

- 固定の暗号化キー `journee-app-encryption-key-2025` がソースコードに露出
- XOR暗号は暗号学的に脆弱
- LocalStorageから簡単に復号可能

### 🟢 Info: レート制限なし

**場所**: 各APIエンドポイント

- `/api/chat` にレート制限なし
- DoS攻撃やAPIコスト増加のリスク

## 修正内容

### 1. middleware.ts - 認証バイパスの削除

```typescript:middleware.ts
// 現在の実装（脆弱）
const testMode = req.headers.get("x-test-mode");
if (testMode === "true") {
  return true;
}

// 修正後（環境変数で制御）
if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST_MODE === 'true') {
  return true;
}
```

**変更点**:

- HTTPヘッダーによるバイパスを削除
- サーバーサイド環境変数のみで制御
- `PLAYWRIGHT_TEST_MODE` 環境変数をE2Eテスト時にのみ設定

### 2. /api/chat - 認証チェック追加

```typescript:app/api/chat/route.ts
export async function POST(request: NextRequest) {
  try {
    // 認証チェックを追加
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 既存のロジック...
```

**変更点**:

- `getCurrentUser()` で認証チェック
- 未認証の場合は 401 エラーを返す

### 3. Claude APIキー保存方式の改善

**2つのアプローチ**:

#### アプローチA: サーバーサイド保存（推奨）

- Supabaseの `user_settings` テーブルに暗号化して保存
- クライアントからは直接アクセス不可
- APIリクエスト時にサーバー側で取得

#### アプローチB: クライアント側暗号化の強化

- 固定キーの代わりにユーザー固有のキーを使用
- Web Crypto API で AES-GCM 暗号化
- 暗号化キーをセッションから派生

**今回の実装**: アプローチBを採用（既存実装の最小限の変更）

### 4. Playwright設定の更新

```typescript:playwright.config.ts
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  env: {
    PLAYWRIGHT_TEST_MODE: 'true',  // この環境変数で認証バイパス
    NODE_ENV: 'test',
  },
}
```

### 5. ドキュメント更新

- セキュリティガイドラインの作成
- 修正内容の記録
- E2Eテストの認証手順の更新

## 実装ファイル

### 修正対象ファイル

1. `middleware.ts` - 認証バイパスロジックの修正
2. `app/api/chat/route.ts` - 認証チェック追加
3. `lib/utils/encryption.ts` - 暗号化方式の改善（オプション）
4. `playwright.config.ts` - テスト環境変数の追加
5. `docs/SECURITY.md` - セキュリティドキュメント作成（新規）

### 影響を受けるファイル

- E2Eテスト: 認証が必要なテストは調整が必要
- フロントエンド: `/api/chat` を呼び出す箇所でエラーハンドリング確認

## 検証方法

### 1. 認証バイパスの検証

```bash
# 失敗すべき（401エラー）
curl -H "x-test-mode: true" http://localhost:3000/api/itinerary/list

# テスト環境でのみ成功
PLAYWRIGHT_TEST_MODE=true npm run dev
```

### 2. チャットAPI認証の検証

```bash
# 未認証では失敗すべき（401エラー）
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### 3. E2Eテストの実行

```bash
npm run test:e2e
```

## ロールバック計画

各ファイルの変更前の状態をコミットとして保存。問題が発生した場合：

1. 該当ファイルを元に戻す
2. E2Eテストを再実行して確認
3. 本番環境への影響を監視

## 注意事項

- 本番環境では `PLAYWRIGHT_TEST_MODE` を絶対に設定しない
- Kubernetes Secret でも `PLAYWRIGHT_TEST_MODE: "false"` または未設定を確認
- 既存のE2Eテストが一部失敗する可能性あり（認証が必要になるため）
- Claude APIキーの暗号化改善は段階的に実装可能

### To-dos

- [ ] middleware.ts の x-test-mode HTTPヘッダーバイパスを削除し、環境変数ベースの制御に変更
- [ ] app/api/chat/route.ts に認証チェックを追加
- [ ] playwright.config.ts に PLAYWRIGHT_TEST_MODE 環境変数を追加
- [ ] 認証バイパスが修正されたことを手動で検証（curl テスト）
- [ ] E2Eテストを実行して既存機能が動作することを確認
- [ ] docs/SECURITY.md を作成し、今回の修正内容とセキュリティガイドラインを記載
- [ ] （オプション）lib/utils/encryption.ts の暗号化方式を Web Crypto API に改善