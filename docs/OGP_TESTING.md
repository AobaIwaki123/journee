# OGP画像のテスト方法

Phase 10.2で実装したOGP画像機能のテスト方法を説明します。

## ローカル環境でのテスト

SNSのクローラーは`localhost:3000`にアクセスできないため、以下の方法でテストします。

### 方法1: メタタグの確認

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **ブラウザで共有ページにアクセス**
   ```
   http://localhost:3000/share/<slug>
   ```

3. **ページのソースを表示**
   - Chrome: `Ctrl+U` (Windows) / `Cmd+Option+U` (Mac)
   - 以下のメタタグが正しく設定されているか確認：
   ```html
   <meta property="og:image" content="http://localhost:3000/api/og?slug=xxx" />
   <meta name="twitter:image" content="http://localhost:3000/api/og?slug=xxx" />
   ```

4. **OGP画像を直接表示**
   - ブラウザで以下のURLにアクセスして画像が表示されるか確認：
   ```
   http://localhost:3000/api/og?slug=<your-slug>
   ```

### 方法2: ngrokを使用（推奨）

ngrokを使ってローカルサーバーを一時的に公開し、実際のSNSでテストする方法です。

#### ngrokのインストール

```bash
# Homebrewを使用（Mac/Linux）
brew install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

#### 使用方法

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **別のターミナルでngrokを起動**
   ```bash
   ngrok http 3000
   ```

3. **ngrokが提供する公開URLをコピー**
   ```
   Forwarding: https://abcd1234.ngrok.io -> http://localhost:3000
   ```

4. **環境変数を一時的に設定**
   `.env.local`ファイルを作成（または編集）：
   ```bash
   NEXT_PUBLIC_BASE_URL=https://abcd1234.ngrok.io
   ```

5. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

6. **SNSのデバッグツールでテスト**
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   
   ngrokのURLを入力：
   ```
   https://abcd1234.ngrok.io/share/<your-slug>
   ```

#### 注意事項
- ngrokの無料版はセッションごとにURLが変わります
- ngrokのURLは一時的なものなので、テスト後は元に戻してください
- `.env.local`は`.gitignore`に含まれているため、コミットされません

### 方法3: Vercel Preview Deploy

最も実際の環境に近い方法です。

1. **ブランチにプッシュ**
   ```bash
   git add .
   git commit -m "feat: implement OGP image generation"
   git push origin your-branch
   ```

2. **Vercelが自動的にプレビュー環境をデプロイ**
   - GitHub PRを作成すると、Vercelが自動的にプレビューURLを生成
   - 例: `https://journee-git-branch-name.vercel.app`

3. **プレビューURLでテスト**
   - SNSのデバッグツールでプレビューURLを入力
   - 実際の本番環境に近い状態でテストできます

## テストチェックリスト

### 画像生成の確認
- [ ] OGP画像APIが正しく動作する（`/api/og?slug=xxx`）
- [ ] タイトル、目的地、日数が正しく表示される
- [ ] 画像サイズが1200x630pxである
- [ ] 日本語が正しく表示される

### メタタグの確認
- [ ] `<meta property="og:image">` が設定されている
- [ ] `<meta property="og:title">` が設定されている
- [ ] `<meta property="og:description">` が設定されている
- [ ] `<meta name="twitter:card">` が `summary_large_image` である
- [ ] `<meta name="twitter:image">` が設定されている

### SNSでの表示確認（ngrok/Vercelで）
- [ ] Twitter Card Validatorで画像が表示される
- [ ] Facebook Sharing Debuggerで画像が表示される
- [ ] 実際にTwitterで共有して画像が表示される
- [ ] 実際にFacebookで共有して画像が表示される
- [ ] LINEで共有して画像が表示される（任意）
- [ ] Slackで共有して画像が表示される（任意）

## トラブルシューティング

### 画像が表示されない

1. **Next.jsの開発サーバーを再起動**
   ```bash
   # Ctrl+C で停止してから
   npm run dev
   ```

2. **ブラウザのキャッシュをクリア**
   - ハードリロード: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

3. **環境変数を確認**
   ```bash
   # .env.localを確認
   cat .env.local
   
   # NEXT_PUBLIC_BASE_URLが正しく設定されているか
   ```

4. **画像生成APIのエラーを確認**
   - ターミナルでエラーログを確認
   - ブラウザの開発者ツールでネットワークエラーを確認

### SNSのキャッシュをクリア

SNSはOGP画像をキャッシュするため、更新が反映されない場合があります。

- **Twitter**: [Card Validator](https://cards-dev.twitter.com/validator)で再取得
- **Facebook**: [Sharing Debugger](https://developers.facebook.com/tools/debug/)の「Scrape Again」ボタンをクリック
- **LINE**: キャッシュクリア方法なし（時間経過を待つ）

### ngrokが起動しない

```bash
# ngrokのバージョンを確認
ngrok version

# アカウント設定（初回のみ）
ngrok config add-authtoken <your-token>
# トークンは https://dashboard.ngrok.com/get-started/your-authtoken から取得
```

## 本番環境でのテスト

本番環境にデプロイ後は、実際のURLでテストできます。

```bash
# 本番環境の環境変数を設定
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# または Vercel の環境変数設定画面で設定
```

## 参考リンク

- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ngrok Documentation](https://ngrok.com/docs)
- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/functions/image-response)