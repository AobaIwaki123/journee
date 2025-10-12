# OGP画像テストガイド

## 概要

このドキュメントでは、実装したOGP画像機能のテスト方法を説明します。

## 📋 実装状況確認

### ステップ1: 実装チェックスクリプトを実行

```bash
npx tsx scripts/check-ogp-implementation.ts
```

**チェック項目:**
- ✅ デフォルトOGP画像API
- ✅ しおりOGP画像API
- ✅ 各ページのメタデータ設定
- ✅ キャッシュ戦略
- ✅ エラーハンドリング

**期待される結果:**
```
🎉 すべての必須チェックに合格しました！
合計: 16 項目
✅ 成功: 16
```

## 🖼️ ローカルでOGP画像を確認

### 方法1: ブラウザでビジュアルテスト（推奨）

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **テストページにアクセス**
   ```
   http://localhost:3000/ogp-test.html
   ```

3. **確認できること:**
   - ✅ デフォルトOGP画像のプレビュー
   - ✅ しおりOGP画像のプレビュー（Slug入力式）
   - ✅ 実装状況サマリー
   - ✅ 外部検証ツールへのリンク
   - ✅ メタデータ設定済みページ一覧

### 方法2: コマンドラインでテスト

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **テストスクリプトを実行**
   ```bash
   bash scripts/test-ogp.sh
   ```

3. **確認できること:**
   - ✅ HTTPステータスコード
   - ✅ Content-Type
   - ✅ 画像サイズ
   - ✅ Cache-Controlヘッダー
   - ✅ 各ページのOGPメタタグ

### 方法3: 直接エンドポイントにアクセス

**デフォルトOGP画像:**
```
http://localhost:3000/api/og/default
```

**しおりOGP画像（例）:**
```
http://localhost:3000/api/og?slug=tokyo-trip-2025
```

> **注意:** しおりOGP画像は、データベースに公開しおりが存在する必要があります。

## 🌐 本番環境でのテスト

### ステップ1: デプロイ後にOGP検証ツールでテスト

#### Facebook Sharing Debugger
https://developers.facebook.com/tools/debug/

1. 本番URLを入力（例: `https://your-domain.com`）
2. 「デバッグ」をクリック
3. OGP画像、タイトル、説明が正しく表示されることを確認

#### Twitter Card Validator
https://cards-dev.twitter.com/validator

1. 本番URLを入力
2. 「Preview card」をクリック
3. Twitter Cardが正しく表示されることを確認

#### LinkedIn Post Inspector
https://www.linkedin.com/post-inspector/

1. 本番URLを入力
2. 「検査」をクリック
3. LinkedInプレビューを確認

### ステップ2: 各ページのOGPをテスト

**テスト対象ページ:**
- ✅ トップページ: `https://your-domain.com/`
- ✅ しおり共有: `https://your-domain.com/share/[slug]`
- ✅ マイページ: `https://your-domain.com/mypage`
- ✅ しおり一覧: `https://your-domain.com/itineraries`
- ✅ プライバシーポリシー: `https://your-domain.com/privacy`
- ✅ 利用規約: `https://your-domain.com/terms`
- ✅ ログイン: `https://your-domain.com/login`

## 📊 チェックリスト

### ローカル環境

- [ ] `npx tsx scripts/check-ogp-implementation.ts` が全項目パス
- [ ] `/api/og/default` が正しく画像を返す
- [ ] `/api/og?slug=test` が適切にエラーハンドリング
- [ ] `http://localhost:3000/ogp-test.html` でビジュアル確認
- [ ] 各ページのHTMLソースに `<meta property="og:image">` がある

### 本番環境

- [ ] Facebook Sharing Debuggerでエラーなし
- [ ] Twitter Card Validatorでカードが表示
- [ ] LinkedIn Post Inspectorで正しく表示
- [ ] すべてのページで画像サイズが1200x630px
- [ ] キャッシュが正しく機能している（2回目のアクセスが高速）

## 🔍 トラブルシューティング

### 問題: OGP画像が表示されない

**原因と解決策:**

1. **画像が生成されていない**
   ```bash
   # デフォルトOGP画像APIの確認
   curl -I http://localhost:3000/api/og/default
   
   # 期待される結果: HTTP/1.1 200 OK
   # Content-Type: image/png
   ```

2. **メタタグが設定されていない**
   ```bash
   # HTMLソースを確認
   curl http://localhost:3000 | grep 'og:image'
   
   # 期待される結果: <meta property="og:image" content="/api/og/default" />
   ```

3. **Edge Runtimeのエラー**
   - サーバーログを確認: `[OGP Image Generation]` や `[OGP Default Image]` で検索
   - エラー詳細が記録されているはず

### 問題: しおりOGP画像が404エラー

**原因:**
- データベースに該当するSlugの公開しおりが存在しない

**解決策:**
1. しおりを作成
2. 公開設定にする
3. Slugを確認してテスト

### 問題: Facebook/Twitterでキャッシュされた古い画像が表示される

**解決策:**
- Facebook Sharing Debuggerの「もう一度スクレイピング」をクリック
- Twitter Card Validatorで再検証
- キャッシュがクリアされるまで数時間待つ

## 📈 パフォーマンス確認

### キャッシュの動作確認

```bash
# 1回目のアクセス（生成）
time curl -o /dev/null http://localhost:3000/api/og/default

# 2回目のアクセス（キャッシュ）
time curl -o /dev/null http://localhost:3000/api/og/default

# 2回目の方が高速であればキャッシュが機能している
```

### レスポンスタイム目標

- **初回生成:** < 500ms
- **キャッシュヒット:** < 100ms
- **画像サイズ:** < 500KB

## 🎯 成功指標

### 定量指標
- [ ] すべてのOGP検証ツールでエラーゼロ
- [ ] 画像生成APIのレスポンスタイム < 500ms
- [ ] 画像ファイルサイズ < 500KB
- [ ] すべてのページで画像が1200x630px

### 定性指標
- [ ] SNSでシェアした際の見栄えが良い
- [ ] 画像がブランドを適切に表現している
- [ ] テキストが読みやすい

## 📚 参考資料

### OGP仕様
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

### Next.js関連
- [Next.js Image Response](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

### 実装ドキュメント
- [OGP実装計画](./OGP_IMPLEMENTATION_PLAN.md)
- [API仕様](./API.md)

## 🆘 サポート

問題が解決しない場合は、以下を確認してください：

1. **ログの確認**
   ```bash
   # 開発サーバーのログを確認
   npm run dev
   ```

2. **実装状況の再確認**
   ```bash
   npx tsx scripts/check-ogp-implementation.ts
   ```

3. **ブラウザのDevToolsでネットワークタブを確認**
   - OGP画像のリクエスト/レスポンスを確認
   - エラーメッセージを確認

---

**最終更新日:** 2025-10-12
