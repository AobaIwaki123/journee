# 環境変数設定ガイド - Journee

このドキュメントでは、Journeeアプリケーションで使用する環境変数について詳しく説明します。

## 📋 目次

1. [環境変数の概要](#環境変数の概要)
2. [必須の環境変数](#必須の環境変数)
3. [オプションの環境変数](#オプションの環境変数)
4. [環境別の設定](#環境別の設定)
5. [セキュリティのベストプラクティス](#セキュリティのベストプラクティス)

---

## 環境変数の概要

Journeeアプリケーションは、機密情報やAPIキーを安全に管理するために環境変数を使用します。

### ローカル開発環境

ローカル開発では`.env.local`ファイルに環境変数を設定します。

```bash
# .env.exampleをコピー
cp .env.example .env.local

# エディタで.env.localを編集
```

### 本番環境（Vercel）

Vercel Dashboardから環境変数を設定します。

1. Vercel Dashboard → プロジェクトを選択
2. 「Settings」→「Environment Variables」
3. 各環境変数を追加

---

## 必須の環境変数

以下の環境変数は**必須**です。これらが設定されていないとアプリケーションが正常に動作しません。

### 1. NEXTAUTH_URL

**説明**: アプリケーションのベースURL

**ローカル開発**:
```
NEXTAUTH_URL=http://localhost:3000
```

**本番環境**:
```
NEXTAUTH_URL=https://your-app-name.vercel.app
```

**注意事項**:
- 末尾のスラッシュ（`/`）は**付けない**
- プロトコル（`http://`または`https://`）を必ず含める
- 本番環境では実際のVercelドメインまたはカスタムドメインを指定

---

### 2. NEXTAUTH_SECRET

**説明**: NextAuth.jsがセッション管理に使用するシークレットキー

**生成方法**:
```bash
openssl rand -base64 32
```

**設定例**:
```
NEXTAUTH_SECRET=your_generated_secret_here_32chars
```

**注意事項**:
- **本番環境では必ず新しいシークレットを生成**してください
- このシークレットは絶対に公開しないでください
- 開発環境と本番環境で異なるシークレットを使用することを推奨

**セキュリティ**:
- 最低32文字の複雑な文字列を使用
- 定期的に更新することを推奨（ただし、更新すると既存のセッションは無効化されます）

---

### 3. GOOGLE_CLIENT_ID

**説明**: Google OAuth認証のクライアントID

**取得方法**:
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「OAuth 2.0 クライアント ID」
5. アプリケーションの種類: **ウェブアプリケーション**
6. 承認済みのリダイレクトURIを設定:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

**設定例**:
```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**注意事項**:
- 開発環境と本番環境で同じクライアントIDを使用可能
- ただし、リダイレクトURIに両方の環境を追加する必要があります

---

### 4. GOOGLE_CLIENT_SECRET

**説明**: Google OAuth認証のクライアントシークレット

**取得方法**: `GOOGLE_CLIENT_ID`と同時に生成されます

**設定例**:
```
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**注意事項**:
- このシークレットは絶対に公開しないでください
- GitHubなどにコミットしないよう注意

---

### 5. GEMINI_API_KEY

**説明**: Google Gemini APIのAPIキー（AIチャット機能に使用）

**取得方法**:
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. 既存のGoogle Cloud Projectを選択、または新規作成
4. 生成されたAPIキーをコピー

**設定例**:
```
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

**注意事項**:
- 無料枠: 60 requests/minute
- レート制限に注意してください
- APIキーは絶対に公開しないでください

**料金**:
- 無料枠で十分に使用可能（個人プロジェクト）
- 詳細: https://ai.google.dev/pricing

---

## オプションの環境変数

以下の環境変数は現在のPhaseでは不要ですが、将来の機能拡張で使用します。

### NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

**説明**: Google Maps JavaScript APIキー（Phase 5で使用予定）

**取得方法**:
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 「APIとサービス」→「ライブラリ」
3. 「Maps JavaScript API」を有効化
4. 「認証情報」からAPIキーを作成

**設定例**:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz9876543
```

**注意事項**:
- `NEXT_PUBLIC_`プレフィックスがついているため、クライアント側でアクセス可能
- APIキー制限を設定することを強く推奨:
  - HTTPリファラー制限（例: `your-domain.vercel.app/*`）
  - API制限（Maps JavaScript APIのみ）

---

### DATABASE_URL

**説明**: データベース接続URL（Phase 8で使用予定）

**設定例**:
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

**注意事項**:
- Vercel PostgresまたはSupabaseを使用予定
- Phase 8実装時に詳細を追加

---

### NODE_ENV

**説明**: Node.js実行環境

**設定**:
- ローカル開発: `development`（自動設定）
- 本番環境: `production`（Vercelが自動設定）

**通常は設定不要**

---

## 環境別の設定

### ローカル開発環境

`.env.local`ファイルに設定:

```bash
# 認証
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_local_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI API
GEMINI_API_KEY=your_gemini_api_key
```

### Vercel本番環境

Vercel Dashboard → Settings → Environment Variablesで設定:

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production, Preview |
| `NEXTAUTH_SECRET` | （生成したシークレット） | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | （GoogleクライアントID） | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | （Googleシークレット） | Production, Preview, Development |
| `GEMINI_API_KEY` | （GeminiAPIキー） | Production, Preview, Development |

**重要**: 
- すべての環境変数を「Production」「Preview」「Development」にチェックを入れて追加
- `NEXTAUTH_SECRET`は本番環境用に新しく生成すること

### Dockerコンテナ環境

Dockerで開発する場合も`.env.local`を使用します:

```bash
# Dockerコンテナ起動
npm run docker:start

# コンテナ内で.env.localが自動的にマウントされます
```

---

## セキュリティのベストプラクティス

### 1. 環境変数の保護

- ❌ **絶対にしないこと**:
  - 環境変数をGitにコミットする
  - 環境変数をクライアント側のコードに埋め込む（`NEXT_PUBLIC_`以外）
  - 環境変数をログ出力する
  - 環境変数をSlackやチャットに貼り付ける

- ✅ **推奨すること**:
  - `.env.local`を`.gitignore`に追加（すでに設定済み）
  - 本番環境用の環境変数を別途管理
  - 環境変数を定期的に更新（特に`NEXTAUTH_SECRET`）

### 2. APIキーの制限

#### Google OAuthクライアント
- リダイレクトURIを厳密に設定
- 不要なスコープは許可しない

#### Gemini APIキー
- Google Cloud Consoleで以下を設定:
  - HTTPリファラー制限
  - IP制限（必要に応じて）
  - 使用量アラート

### 3. 環境変数のローテーション

以下の場合は環境変数を更新してください:

- セキュリティ侵害の疑いがある場合
- チームメンバーが退職した場合（該当する場合）
- 定期メンテナンス（年1回推奨）

---

## トラブルシューティング

### 環境変数が読み込まれない

**原因**: ファイル名が間違っているか、Next.jsサーバーが再起動されていない

**解決方法**:
```bash
# ファイル名を確認
ls -la .env.local

# Next.jsサーバーを再起動
npm run dev
```

### Vercelで環境変数が反映されない

**原因**: 環境変数設定後に再デプロイしていない

**解決方法**:
1. Vercel Dashboard → Deployments
2. 最新のデプロイメントの「...」メニュー → Redeploy

### Google OAuth認証エラー

**原因**: リダイレクトURIが正しく設定されていない

**解決方法**:
1. Google Cloud ConsoleでリダイレクトURIを確認
2. `NEXTAUTH_URL`と一致しているか確認
3. プロトコル（`http://`、`https://`）を含めているか確認

---

## チェックリスト

開発開始前に以下を確認:

- [ ] `.env.local`ファイルを作成（`.env.example`をコピー）
- [ ] すべての必須環境変数を設定
- [ ] Google OAuthクライアントを作成
- [ ] Gemini APIキーを取得
- [ ] NextAuthシークレットを生成
- [ ] `.env.local`が`.gitignore`に含まれていることを確認

Vercelデプロイ前に以下を確認:

- [ ] Vercel Dashboardに全ての環境変数を追加
- [ ] `NEXTAUTH_URL`を本番URLに更新
- [ ] Google OAuthのリダイレクトURIに本番URLを追加
- [ ] 本番環境用の新しい`NEXTAUTH_SECRET`を生成

---

**最終更新**: 2025-10-07
**対応Phase**: Phase 10 - デプロイ・運用