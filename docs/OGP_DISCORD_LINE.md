# Discord/LINEでのOGP画像表示について

## 重要な注意事項

### ⚠️ ローカル環境では表示されません

**Discord、LINE、その他のSNSでOGP画像をテストするには、本番環境（公開URL）が必要です。**

**理由:**
- `localhost:3000` は外部のDiscord/LINEサーバーからアクセスできません
- OGP画像を表示するには、Discord/LINEのサーバーがあなたのサーバーにアクセスして画像を取得する必要があります
- ローカル開発環境は外部からアクセスできないため、画像が表示されません

## テスト方法

### ✅ 本番環境デプロイ後

1. **アプリケーションをデプロイ**
   ```bash
   # Vercelにデプロイ（例）
   vercel --prod
   
   # または
   git push origin main
   ```

2. **環境変数を設定**
   
   **Vercelの場合:**
   - Vercelダッシュボード → Settings → Environment Variables
   - `NEXT_PUBLIC_BASE_URL` を追加
   - 値: `https://your-domain.com` （あなたの本番URL）

3. **デプロイ完了後にテスト**

### Discord でテスト

1. **プライベートチャンネルまたはDMで試す**
   ```
   https://your-domain.com
   ```

2. **リンクを投稿**
   - Discordが自動的にOGP画像を取得して表示

3. **表示されない場合**
   - URLが正しいか確認
   - 数分待ってキャッシュが更新されるのを待つ
   - `Ctrl+R` または `Cmd+R` でDiscordをリロード

### LINE でテスト

1. **Keep（自分専用）にURLを送信**
   ```
   https://your-domain.com
   ```

2. **リンクをタップ**
   - OGP画像とタイトルが表示される

3. **表示されない場合**
   - URLが正しいか確認
   - LINEアプリを再起動
   - しばらく待ってから再度試す

## ローカル環境で確認する方法

### 1. ビジュアルテストページを使用

```bash
npm run dev
# http://localhost:3000/ogp-test.html にアクセス
```

ここで画像が正しく生成されていることを確認できます。

### 2. ngrokを使用して一時的に公開（上級者向け）

```bash
# ngrokをインストール
npm install -g ngrok

# 開発サーバーを起動
npm run dev

# 別のターミナルでngrokを起動
ngrok http 3000
```

ngrokが提供する公開URL（例: `https://abc123.ngrok.io`）を使ってDiscord/LINEでテスト可能。

**注意:** ngrokの無料プランは一時的なURLなので、セッションが終わるとURLが変わります。

## 確認チェックリスト

### デプロイ前

- [ ] `app/layout.tsx` の `metadataBase` が正しく設定されている
- [ ] `/api/og/default` が正しく動作している（`/ogp-test.html`で確認）
- [ ] すべてのページに適切なメタデータが設定されている

### デプロイ後

- [ ] 環境変数 `NEXT_PUBLIC_BASE_URL` が設定されている
- [ ] `https://your-domain.com/api/og/default` にアクセスして画像が表示される
- [ ] ページのHTMLソースで `<meta property="og:image">` が絶対URLになっている

### Discord/LINE テスト

- [ ] Discordのプライベートチャンネルでリンクを投稿
- [ ] OGP画像、タイトル、説明が表示される
- [ ] LINEのKeepでリンクを送信
- [ ] OGP画像とタイトルが表示される

## トラブルシューティング

### 問題: Discordで画像が表示されない

**原因1: キャッシュ**
- Discordは一度取得したOGPをキャッシュします
- 画像を更新した場合、キャッシュが更新されるまで時間がかかります

**解決策:**
- URLの末尾にクエリパラメータを追加して新しいURLとして認識させる
  ```
  https://your-domain.com/?v=2
  ```
- または数時間～1日待つ

**原因2: 画像サイズ**
- 画像が大きすぎる（8MB超）
- 画像が小さすぎる

**解決策:**
- 実装済みのOGP画像は1200x630pxで最適化されています
- 問題ないはずですが、ブラウザで `/api/og/default` にアクセスして確認

**原因3: HTTPS**
- HTTPではなくHTTPSが必要

**解決策:**
- Vercelなどのホスティングサービスは自動的にHTTPSを提供
- 独自ドメインの場合、SSL証明書を設定

### 問題: LINEで画像が表示されない

**原因1: URL形式**
- LINEは特定のURL形式を要求する場合があります

**解決策:**
- URLが正しい形式か確認
- `https://` から始まっているか確認

**原因2: リダイレクト**
- 多段階のリダイレクトがあると取得失敗する可能性

**解決策:**
- リダイレクトを最小限にする
- Next.jsの `metadataBase` が正しく設定されていることを確認

## メタデータの確認方法

### ブラウザで確認

```bash
# ページのHTMLソースを取得
curl https://your-domain.com | grep 'og:image'

# 期待される結果（絶対URLになっているはず）:
# <meta property="og:image" content="https://your-domain.com/api/og/default" />
```

### OGP検証ツールで確認

デプロイ後、以下のツールで検証できます：

1. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Discordと同じOGPプロトコルを使用

2. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Twitter Card専用ですが、OGPの基本チェックに使えます

3. **OGP確認ツール（日本語）**
   - https://rakko.tools/tools/9/
   - 手軽に日本語でOGPを確認できます

## まとめ

| 環境 | Discord/LINE | 確認方法 |
|------|--------------|----------|
| ローカル | ❌ 表示されない | `/ogp-test.html` でビジュアル確認 |
| 本番環境 | ✅ 表示される | 実際にリンクを投稿してテスト |

**重要:** Discord/LINEでOGP画像をテストするには、必ず本番環境にデプロイしてください。

---

**関連ドキュメント:**
- [OGP_TESTING.md](./OGP_TESTING.md) - 包括的なテストガイド
- [OGP_IMPLEMENTATION_PLAN.md](./OGP_IMPLEMENTATION_PLAN.md) - 実装計画
