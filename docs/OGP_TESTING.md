# OGP画像テストガイド

## 概要

このドキュメントでは、実装したOGP画像機能のテスト方法を説明します。

## 前提条件

- アプリケーションがデプロイまたはローカルで起動していること
- テスト対象のURLにアクセス可能であること

## 自動テスト

### 1. TypeScript型チェック

```bash
npm run type-check
```

**期待結果:** エラーなし

### 2. ESLint

```bash
npm run lint
```

**期待結果:** エラーなし

### 3. ビルドテスト

```bash
npm run build
```

**期待結果:** ビルド成功

## 手動テスト

### 1. デフォルトOGP画像の確認

#### ローカル環境

```bash
# 開発サーバー起動
npm run dev

# 別のターミナルで
curl -I http://localhost:3000/api/og/default
```

**期待結果:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800
```

#### ブラウザで確認

1. http://localhost:3000/api/og/default にアクセス
2. 以下の要素を含む画像が表示されること：
   - ✈️ アイコン（中央上部）
   - "Journee" ロゴ（大きく中央）
   - "AI旅のしおり作成アプリ" キャッチコピー
   - 紫系グラデーション背景

### 2. しおりOGP画像の確認

```bash
# 公開しおりのslugを使用
curl -I http://localhost:3000/api/og?slug=your-slug-here
```

**期待結果:**
- 200 OK
- しおりのタイトル、目的地、日数を含む画像

### 3. ページメタデータの確認

各ページにアクセスし、ブラウザの開発者ツールで`<meta>`タグを確認：

#### トップページ (/)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="Journee - AI旅のしおり作成アプリ" />
<meta name="twitter:card" content="summary_large_image" />
```

#### マイページ (/mypage)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="[ユーザー名]のマイページ | Journee" />
<meta name="robots" content="noindex, nofollow" />
```

#### しおり一覧 (/itineraries)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="しおり一覧 | Journee" />
```

#### ログインページ (/login)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="ログイン | Journee" />
```

#### プライバシーポリシー (/privacy)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="プライバシーポリシー | Journee" />
```

#### 利用規約 (/terms)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="利用規約 | Journee" />
```

#### 設定ページ (/settings)

```html
<meta property="og:image" content="http://localhost:3000/api/og/default" />
<meta property="og:title" content="設定 | Journee" />
<meta name="robots" content="noindex, nofollow" />
```

#### しおり共有ページ (/share/[slug])

```html
<meta property="og:image" content="http://localhost:3000/api/og?slug=[slug]" />
<meta property="og:title" content="[しおりタイトル] | Journee" />
```

## OGP検証ツールでのテスト

### 1. Facebook Sharing Debugger

URL: https://developers.facebook.com/tools/debug/

#### テスト手順

1. 上記URLにアクセス
2. テストしたいURLを入力（例: `https://your-domain.com/`）
3. "デバッグ" ボタンをクリック
4. 結果を確認

#### チェック項目

- [ ] 画像が正しく表示される
- [ ] 画像サイズが1200x630pxである
- [ ] タイトルが正しく表示される
- [ ] 説明文が正しく表示される
- [ ] エラーが表示されない

#### 主なエラーと対処法

**エラー:** "The 'og:image' property should be explicitly provided"
- **原因:** OGP画像URLが相対パスになっている
- **対処:** `metadataBase`を確認し、絶対URLになっていることを確認

**エラー:** "Could not resolve image"
- **原因:** 画像生成APIがエラーを返している
- **対処:** APIのログを確認し、エラー原因を特定

### 2. Twitter Card Validator

URL: https://cards-dev.twitter.com/validator

#### テスト手順

1. 上記URLにアクセス
2. テストしたいURLを入力
3. "Preview card" ボタンをクリック
4. プレビューを確認

#### チェック項目

- [ ] カードタイプが "summary_large_image" である
- [ ] 画像が正しく表示される
- [ ] タイトルが正しく表示される
- [ ] 説明文が正しく表示される

### 3. LinkedIn Post Inspector

URL: https://www.linkedin.com/post-inspector/

#### テスト手順

1. 上記URLにアクセス
2. テストしたいURLを入力
3. "Inspect" ボタンをクリック
4. プレビューを確認

#### チェック項目

- [ ] 画像が正しく表示される
- [ ] タイトルが正しく表示される
- [ ] 説明文が正しく表示される

## パフォーマンステスト

### レスポンスタイム測定

```bash
# デフォルトOGP画像
time curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000/api/og/default

# しおりOGP画像
time curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000/api/og?slug=your-slug
```

**期待値:**
- 初回: 200-500ms
- 2回目以降（キャッシュ有効）: 50ms以下

### キャッシュ動作確認

```bash
# 1回目のリクエスト
curl -I http://localhost:3000/api/og/default

# Cache-Controlヘッダーを確認
# Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800

# 2回目のリクエスト（キャッシュから取得されるはず）
curl -I http://localhost:3000/api/og/default
```

## E2Eテスト（オプション）

### テストファイル作成

`e2e/ogp-images.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('OGP画像テスト', () => {
  test('トップページのOGP画像が設定されている', async ({ page }) => {
    await page.goto('/');
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('/api/og/default');
    
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBe('Journee - AI旅のしおり作成アプリ');
  });

  test('マイページのOGP画像が設定されている', async ({ page }) => {
    // 認証が必要な場合は事前にログイン
    await page.goto('/mypage');
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('/api/og/default');
  });

  test('デフォルトOGP画像が生成される', async ({ page }) => {
    const response = await page.goto('/api/og/default');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image');
  });
});
```

### テスト実行

```bash
npx playwright test e2e/ogp-images.spec.ts
```

## トラブルシューティング

### 問題: 画像が表示されない

#### 確認事項

1. **APIが正常に動作しているか**
   ```bash
   curl -I http://localhost:3000/api/og/default
   ```

2. **metadataBaseが正しく設定されているか**
   - `app/layout.tsx`の`metadataBase`を確認
   - 本番環境では`NEXT_PUBLIC_BASE_URL`または`VERCEL_URL`が設定されているか確認

3. **ビルドエラーがないか**
   ```bash
   npm run build
   ```

### 問題: Facebook Debuggerでエラーが出る

#### 対処法

1. **キャッシュをクリア**
   - Facebook Debuggerの "Fetch new information" ボタンをクリック

2. **絶対URLを使用**
   - 画像URLが相対パスになっていないか確認

3. **画像サイズを確認**
   - 1200x630pxになっているか確認

### 問題: 画像生成が遅い

#### 対処法

1. **Edge Runtimeを使用**
   - `export const runtime = 'edge';`が設定されているか確認

2. **キャッシュを有効化**
   - `Cache-Control`ヘッダーが設定されているか確認

3. **Vercelにデプロイ**
   - ローカル環境よりも本番環境（Vercel）の方が高速

## チェックリスト

実装完了後、以下をすべて確認してください：

### 機能テスト
- [ ] デフォルトOGP画像が生成される
- [ ] しおりOGP画像が生成される
- [ ] 各ページに適切なメタデータが設定されている

### OGP検証
- [ ] Facebook Sharing Debuggerでエラーなし
- [ ] Twitter Card Validatorでエラーなし
- [ ] LinkedIn Post Inspectorでエラーなし

### パフォーマンス
- [ ] 画像生成が500ms以内（初回）
- [ ] キャッシュが正常に動作
- [ ] レスポンスヘッダーに`Cache-Control`が含まれる

### ビルド
- [ ] `npm run type-check` 成功
- [ ] `npm run lint` 成功
- [ ] `npm run build` 成功

### アクセシビリティ
- [ ] altテキストが設定されている
- [ ] 画像が読み込めない場合のフォールバックがある

## 関連ドキュメント

- [docs/OGP_IMPLEMENTATION_PLAN.md](./OGP_IMPLEMENTATION_PLAN.md) - 実装計画
- [docs/OGP_PR_SUMMARY.md](./OGP_PR_SUMMARY.md) - PR サマリー
- [app/api/og/route.tsx](../app/api/og/route.tsx) - しおりOGP画像生成API
- [app/api/og/default/route.tsx](../app/api/og/default/route.tsx) - デフォルトOGP画像生成API

## 参考リンク

- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)
