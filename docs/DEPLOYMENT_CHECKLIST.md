# Vercelデプロイチェックリスト

Journeeアプリケーションを素早くデプロイするためのチェックリストです。
詳細な手順は [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) を参照してください。

## 📋 事前準備

### 1. アカウント準備
- [ ] GitHubアカウント作成済み
- [ ] Vercelアカウント作成済み
- [ ] Google Cloud Platformアカウント作成済み
- [ ] Google AI Studioアカウント作成済み

### 2. リポジトリ準備
- [ ] GitHubリポジトリ作成済み
- [ ] コードをプッシュ済み
- [ ] `.env.local` は `.gitignore` に含まれている（✅ 既に設定済み）

## 🔑 APIキー取得

### Google OAuth
- [ ] Google Cloud Consoleでプロジェクト作成
- [ ] OAuth 2.0クライアントID作成
- [ ] クライアントIDをコピー: `GOOGLE_CLIENT_ID`
- [ ] クライアントシークレットをコピー: `GOOGLE_CLIENT_SECRET`
- [ ] リダイレクトURI設定（後で更新）

### Gemini API
- [ ] Google AI Studioにアクセス
- [ ] APIキー取得: `GEMINI_API_KEY`

### NextAuth Secret
- [ ] シークレット生成: `openssl rand -base64 32`
- [ ] 生成したキーをコピー: `NEXTAUTH_SECRET`

## 🚀 Vercelデプロイ

### 1. プロジェクト作成
- [ ] Vercel ダッシュボードにログイン
- [ ] 「Add New...」→「Project」をクリック
- [ ] GitHubリポジトリをインポート
- [ ] Framework Preset: `Next.js` を確認

### 2. 環境変数設定

以下の環境変数を追加（すべての環境にチェック）：

#### 必須
- [ ] `NEXTAUTH_URL` = `https://your-app-name.vercel.app` （仮のURLで可）
- [ ] `NEXTAUTH_SECRET` = （生成したシークレット）
- [ ] `GOOGLE_CLIENT_ID` = （Google OAuthのクライアントID）
- [ ] `GOOGLE_CLIENT_SECRET` = （Google OAuthのクライアントシークレット）
- [ ] `GEMINI_API_KEY` = （Gemini APIキー）

#### オプション
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = （Google Maps APIキー）

### 3. デプロイ実行
- [ ] 「Deploy」をクリック
- [ ] ビルドログを確認
- [ ] デプロイURLをコピー（例: `https://journee-xxxxx.vercel.app`）

## 🔄 デプロイ後の設定

### 1. Google OAuth更新
- [ ] Google Cloud Consoleに戻る
- [ ] 「APIとサービス」→「認証情報」
- [ ] 「承認済みのリダイレクトURI」に追加:
  ```
  https://journee-xxxxx.vercel.app/api/auth/callback/google
  ```
- [ ] 「保存」をクリック

### 2. NEXTAUTH_URL更新
- [ ] Vercelダッシュボードに戻る
- [ ] 「Settings」→「Environment Variables」
- [ ] `NEXTAUTH_URL` を実際のURLに更新
- [ ] 「Deployments」→「Redeploy」を実行

## ✅ 動作確認

### 基本動作
- [ ] デプロイURLにアクセス
- [ ] ログインページが表示される
- [ ] Googleログインが成功する
- [ ] メインページが表示される
- [ ] チャット機能が動作する
- [ ] AIレスポンスが返る
- [ ] しおりが表示される

### APIチェック
- [ ] `/api/health` にアクセスして正常レスポンス確認

### ログ確認
- [ ] Vercel ダッシュボード →「Functions」でログ確認
- [ ] エラーがないことを確認

## 🌐 カスタムドメイン設定（オプション）

- [ ] Vercel →「Settings」→「Domains」でドメイン追加
- [ ] DNSレコード設定（A/CNAMEレコード）
- [ ] SSL証明書の発行完了を確認
- [ ] Google OAuthのリダイレクトURI更新
- [ ] `NEXTAUTH_URL` をカスタムドメインに更新
- [ ] 再デプロイ

## 🛡️ セキュリティチェック

- [ ] すべてのAPIキーが環境変数で管理されている
- [ ] `.env.local` がGitにコミットされていない
- [ ] セキュリティヘッダーが設定されている（`next.config.js`）
- [ ] HTTPS接続が有効（Vercelは自動設定）

## 📊 モニタリング設定

- [ ] Vercel Analytics有効化
- [ ] エラーログの確認方法を把握
- [ ] （推奨）Sentryなどのエラートラッキング設定

## 🎉 完了！

すべてチェックできたら、デプロイ完了です！

---

## 📚 参考ドキュメント

- [詳細デプロイガイド](./VERCEL_DEPLOYMENT_GUIDE.md)
- [環境変数テンプレート](../.env.example)
- [README](../README.md)
- [クイックスタートガイド](./QUICK_START.md)

---

## ❓ トラブルシューティング

### よくある問題

| 問題 | 解決策 |
|------|--------|
| ビルドエラー | ローカルで `npm run build` を実行して確認 |
| OAuth認証エラー | リダイレクトURIが正確か確認 |
| 環境変数が読み込まれない | すべての環境にチェックが入っているか確認 |
| ログインループ | `NEXTAUTH_SECRET` と `NEXTAUTH_URL` を確認 |

詳細は [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) の「トラブルシューティング」セクションを参照してください。

---

**最終更新**: 2025-10-07
