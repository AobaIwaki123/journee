# OGP画像テスト手順

## 概要

このドキュメントでは、JourneeのOGP（Open Graph Protocol）画像が正しく表示されることを確認する手順を説明します。

## テスト対象ページ

### 公開ページ
- **トップページ** (`/`)
- **しおり共有ページ** (`/share/[slug]`)
- **ログインページ** (`/login`)
- **プライバシーポリシー** (`/privacy`)
- **利用規約** (`/terms`)

### 認証が必要なページ
- **設定ページ** (`/settings`)

## OGP検証ツール

### 1. Facebook Sharing Debugger

**URL:** https://developers.facebook.com/tools/debug/

**使い方:**
1. テストしたいページのURLを入力
2. 「デバッグ」ボタンをクリック
3. OGP画像、タイトル、説明文が正しく表示されることを確認

**確認項目:**
- [ ] OGP画像が表示される（1200x630px）
- [ ] タイトルが適切に設定されている
- [ ] 説明文が適切に設定されている
- [ ] `og:type` が `website` になっている
- [ ] エラーや警告が表示されていない

**トラブルシューティング:**
- キャッシュされた古い情報が表示される場合は「新しいスクレイピング情報」ボタンをクリック

### 2. Twitter Card Validator

**URL:** https://cards-dev.twitter.com/validator

**使い方:**
1. テストしたいページのURLを入力
2. 「Preview card」ボタンをクリック
3. Twitter Cardのプレビューを確認

**確認項目:**
- [ ] Twitter Card画像が表示される
- [ ] `twitter:card` が `summary_large_image` になっている
- [ ] タイトルと説明文が表示される
- [ ] プレビューが適切に表示される

**注意:**
- Twitter Card Validatorは2023年以降、アクセスが制限されている場合があります
- その場合は実際にツイートして確認するか、代替ツールを使用してください

### 3. LinkedIn Post Inspector

**URL:** https://www.linkedin.com/post-inspector/

**使い方:**
1. テストしたいページのURLを入力
2. 「Inspect」ボタンをクリック
3. プレビューを確認

**確認項目:**
- [ ] OGP画像が表示される
- [ ] タイトルと説明文が適切に表示される
- [ ] 画像のアスペクト比が正しい

### 4. その他のツール

#### Open Graph Check
**URL:** https://opengraphcheck.com/

複数のSNSでの表示を一度に確認できる便利なツール。

#### Social Share Preview
**URL:** https://socialsharepreview.com/

Facebook, Twitter, LinkedInでの表示を確認可能。

## ローカル環境でのテスト

### 開発サーバーでの確認

1. 開発サーバーを起動
```bash
npm run dev
```

2. ngrokなどのトンネリングツールを使用して外部公開
```bash
ngrok http 3000
```

3. ngrokで生成されたURLを使用してOGP検証ツールでテスト

**注意:**
- ローカル環境では `http://localhost:3000` はOGP検証ツールからアクセスできません
- ngrokや類似のツールで一時的に公開URLを作成する必要があります

### 本番環境での確認

Vercelにデプロイ後、実際のURLでOGP検証ツールを使用してテストします。

## テストチェックリスト

### トップページ (`/`)

- [ ] Facebook Sharing Debuggerで確認
- [ ] Twitter Card Validatorで確認
- [ ] LinkedIn Post Inspectorで確認
- [ ] OGP画像が `/api/og/default` から生成されている
- [ ] 画像サイズが1200x630px
- [ ] タイトル: "Journee - AI旅のしおり作成アプリ"
- [ ] 説明文が適切に設定されている

### しおり共有ページ (`/share/[slug]`)

- [ ] Facebook Sharing Debuggerで確認
- [ ] Twitter Card Validatorで確認
- [ ] LinkedIn Post Inspectorで確認
- [ ] OGP画像が `/api/og?slug=xxx` から動的生成されている
- [ ] しおりのタイトルが表示されている
- [ ] 目的地と日数が表示されている
- [ ] 画像サイズが1200x630px

### ログインページ (`/login`)

- [ ] OGP画像が `/api/og/default` から生成されている
- [ ] タイトル: "ログイン | Journee"
- [ ] 説明文: "Journeeにログインして、AIとともに旅のしおりを作成しましょう。"

### プライバシーポリシー (`/privacy`)

- [ ] OGP画像が `/api/og/default` から生成されている
- [ ] タイトル: "プライバシーポリシー | Journee"
- [ ] 説明文が適切に設定されている
- [ ] `robots` メタタグが `index: true, follow: true` になっている

### 利用規約 (`/terms`)

- [ ] OGP画像が `/api/og/default` から生成されている
- [ ] タイトル: "利用規約 | Journee"
- [ ] 説明文が適切に設定されている
- [ ] `robots` メタタグが `index: true, follow: true` になっている

### 設定ページ (`/settings`)

- [ ] OGP画像が `/api/og/default` から生成されている
- [ ] タイトル: "設定 | Journee"
- [ ] 説明文が適切に設定されている

## よくある問題と解決方法

### 問題1: OGP画像が表示されない

**原因:**
- 画像生成APIがエラーを返している
- キャッシュされた古い情報が表示されている
- `metadataBase` が正しく設定されていない

**解決方法:**
1. `/api/og/default` または `/api/og?slug=xxx` に直接アクセスして画像が生成されることを確認
2. OGP検証ツールで「新しいスクレイピング」を実行
3. `app/layout.tsx` の `metadataBase` を確認

### 問題2: 古い画像が表示される

**原因:**
- SNS側でキャッシュされている
- CDNでキャッシュされている

**解決方法:**
1. Facebook Sharing Debuggerで「新しいスクレイピング情報」をクリック
2. URLにクエリパラメータ（例: `?v=2`）を追加してキャッシュを回避
3. しばらく待ってから再度確認

### 問題3: 画像サイズが正しくない

**原因:**
- `ImageResponse` のサイズ設定が間違っている
- OGPメタタグの `width` と `height` が間違っている

**解決方法:**
1. `/api/og/route.tsx` と `/api/og/default/route.tsx` で `width: 1200, height: 630` を確認
2. 各ページのメタデータ設定で `width: 1200, height: 630` を確認

### 問題4: 本番環境でのみエラーが発生

**原因:**
- Edge Runtimeでサポートされていない機能を使用している
- 環境変数が正しく設定されていない

**解決方法:**
1. Vercelのログを確認
2. Edge Runtimeの制限事項を確認
3. 環境変数（`NEXT_PUBLIC_BASE_URL`, `DATABASE_URL` など）を確認

### 問題5: データベース接続エラー

**原因:**
- しおり共有ページのOGP画像生成時にデータベースへの接続が失敗

**解決方法:**
1. Supabaseの接続情報を確認
2. エラーログを確認（`[OGP Image Generation Error]`）
3. フォールバック画像が表示されることを確認

## パフォーマンス確認

### 画像生成速度

**目標:** 500ms以下

**確認方法:**
```bash
# デフォルトOGP画像
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/og/default

# しおり共有OGP画像
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/og?slug=xxx
```

`curl-format.txt`:
```
time_total: %{time_total}s
```

### キャッシュ確認

**確認方法:**
1. Chrome DevToolsのNetworkタブを開く
2. OGP画像のURLにアクセス
3. Response Headersで `Cache-Control` を確認

**期待される値:**
- デフォルトOGP: `public, max-age=604800, s-maxage=604800, immutable`
- しおり共有OGP: `public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`

## 自動化

### Playwrightテスト

OGPメタデータの存在を確認するE2Eテストを追加できます。

```typescript
// e2e/ogp-metadata.spec.ts
import { test, expect } from '@playwright/test';

test('トップページのOGPメタデータが正しく設定されている', async ({ page }) => {
  await page.goto('/');
  
  // OGP画像
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogImage).toContain('/api/og/default');
  
  // OGPタイトル
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
  expect(ogTitle).toBe('Journee - AI旅のしおり作成アプリ');
  
  // Twitter Card
  const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
  expect(twitterCard).toBe('summary_large_image');
});
```

## まとめ

OGP画像が正しく表示されることで：
- SNSでのシェア時の見栄えが向上
- クリック率（CTR）が向上
- ブランド認知度が向上

定期的にOGP検証ツールでチェックし、問題がないことを確認してください。

