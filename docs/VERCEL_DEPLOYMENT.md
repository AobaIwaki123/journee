# Vercelデプロイガイド - Journee

このドキュメントでは、JourneeアプリケーションをVercelにデプロイする手順を詳しく説明します。

## 📋 目次

1. [事前準備](#事前準備)
2. [環境変数の準備](#環境変数の準備)
3. [Vercelプロジェクトの作成](#vercelプロジェクトの作成)
4. [デプロイの実行](#デプロイの実行)
5. [デプロイ後の設定](#デプロイ後の設定)
6. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 1. 必要なアカウント

以下のアカウントを事前に作成してください：

- **Vercelアカウント**: https://vercel.com/signup
- **GitHubアカウント**: https://github.com/signup（推奨）
- **Google Cloud Platform**: https://console.cloud.google.com/
- **Google AI Studio**: https://aistudio.google.com/

### 2. ローカルでのビルド確認

デプロイ前にローカル環境でビルドが成功することを確認します。

```bash
# 依存関係のインストール
npm install

# プロダクションビルド
npm run build

# ビルドしたアプリケーションの起動
npm start
```

ビルドエラーが発生した場合は、エラーメッセージを確認して修正してください。

---

## 環境変数の準備

### 1. Google OAuth認証設定

#### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアント ID」を選択
5. アプリケーションの種類: **ウェブアプリケーション**
6. 承認済みのリダイレクトURIに以下を追加:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
   ※ `your-app-name`は後でVercelから割り当てられるドメイン名に置き換えます
7. クライアントIDとクライアントシークレットをメモ

### 2. Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. 生成されたAPIキーをメモ

### 3. NextAuth シークレットの生成

ターミナルで以下のコマンドを実行してシークレットキーを生成:

```bash
openssl rand -base64 32
```

生成された文字列をメモしておきます。

### 4. 環境変数一覧

以下の環境変数を準備してください：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXTAUTH_URL` | アプリケーションのURL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuthのシークレットキー | `openssl rand -base64 32`で生成 |
| `GOOGLE_CLIENT_ID` | Google OAuthのクライアントID | `123456789-abc...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuthのクライアントシークレット | `GOCSPX-...` |
| `GEMINI_API_KEY` | Google Gemini APIキー | `AIza...` |

---

## Vercelプロジェクトの作成

### 方法1: Vercel Dashboard（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリをインポート
   - GitHubアカウントを連携していない場合は「Connect Git Provider」から連携
   - リポジトリ一覧から`journee`を選択
4. プロジェクト設定:
   - **Framework Preset**: Next.js（自動検出）
   - **Root Directory**: `.`（デフォルト）
   - **Build Command**: `npm run build`（自動設定）
   - **Output Directory**: `.next`（自動設定）

### 方法2: Vercel CLI

```bash
# Vercel CLIのインストール（初回のみ）
npm install -g vercel

# プロジェクトディレクトリでVercelにログイン
vercel login

# デプロイ
vercel
```

---

## デプロイの実行

### 1. 環境変数の設定

Vercel Dashboard で環境変数を設定します。

1. プロジェクトページの「Settings」タブに移動
2. 左メニューから「Environment Variables」を選択
3. 以下の環境変数を追加:

#### 追加する環境変数

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=<生成したシークレット>
GOOGLE_CLIENT_ID=<GoogleクライアントID>
GOOGLE_CLIENT_SECRET=<Googleクライアントシークレット>
GEMINI_API_KEY=<GeminiAPIキー>
```

**重要**: 
- すべての環境変数を「Production」「Preview」「Development」の3つの環境すべてにチェックを入れて追加してください
- `NEXTAUTH_URL`はVercelから割り当てられた実際のドメイン名に置き換えてください

### 2. 初回デプロイ

1. Vercel Dashboardで「Deploy」ボタンをクリック
2. ビルドログを確認
3. デプロイが成功したら、割り当てられたURLをメモ

### 3. Google OAuthのリダイレクトURI更新

1. [Google Cloud Console](https://console.cloud.google.com/) に戻る
2. 「APIとサービス」→「認証情報」
3. 作成したOAuth 2.0クライアントIDを編集
4. 承認済みのリダイレクトURIに以下を追加:
   ```
   https://your-actual-vercel-domain.vercel.app/api/auth/callback/google
   ```
5. 保存

### 4. NEXTAUTH_URLの更新

1. Vercel Dashboardに戻る
2. 「Settings」→「Environment Variables」
3. `NEXTAUTH_URL`を編集して、実際のVercelドメインに更新:
   ```
   https://your-actual-vercel-domain.vercel.app
   ```
4. 保存後、再デプロイ:
   - 「Deployments」タブに移動
   - 最新のデプロイメントの右側の「...」メニューから「Redeploy」を選択

---

## デプロイ後の設定

### 1. カスタムドメインの設定（オプション）

1. Vercel Dashboardの「Settings」→「Domains」に移動
2. カスタムドメインを追加
3. DNSレコードを設定（Vercelが表示する手順に従う）
4. カスタムドメインを使用する場合:
   - `NEXTAUTH_URL`を更新
   - Google OAuthのリダイレクトURIに追加

### 2. Analytics設定（オプション）

1. Vercel Dashboardの「Analytics」タブに移動
2. 「Enable Analytics」をクリック
3. アクセス解析が有効化されます

### 3. プレビューデプロイの設定

Vercelはデフォルトで以下のようにデプロイします：

- **本番デプロイ**: `main`ブランチへのプッシュ
- **プレビューデプロイ**: その他のブランチへのプッシュやPR作成時

この動作は「Settings」→「Git」から変更可能です。

---

## トラブルシューティング

### ビルドエラー: "Module not found"

**原因**: 依存関係がインストールされていない

**解決方法**:
1. `package.json`に必要なパッケージが記載されているか確認
2. ローカルで`npm install`を実行してテスト
3. 変更をコミットして再デプロイ

### 認証エラー: "Callback URL mismatch"

**原因**: Google OAuthのリダイレクトURIが正しく設定されていない

**解決方法**:
1. Google Cloud ConsoleでリダイレクトURIを確認
2. Vercelのドメインと完全に一致しているか確認
3. プロトコル（`https://`）が含まれているか確認

### 環境変数が反映されない

**原因**: 環境変数の設定後に再デプロイしていない

**解決方法**:
1. 環境変数を変更した後は必ず再デプロイ
2. Vercel Dashboardの「Deployments」→「Redeploy」を実行

### APIタイムアウトエラー

**原因**: Gemini APIのレスポンスが遅い、またはAPIキーが無効

**解決方法**:
1. Gemini APIキーが正しいか確認
2. APIクォータ制限に達していないか確認
3. `next.config.js`の`experimental.serverActions.bodySizeLimit`を確認

### ストリーミングレスポンスが機能しない

**原因**: Vercelのエッジランタイムの制限

**解決方法**:
- `next.config.js`の設定を確認
- API Routeで`runtime: 'nodejs'`を明示的に指定（必要な場合）

---

## デプロイ後のチェックリスト

- [ ] アプリケーションにアクセスできる
- [ ] Googleログインが正常に動作する
- [ ] チャット機能が動作する（Gemini APIとの通信）
- [ ] AIレスポンスがリアルタイムでストリーミング表示される
- [ ] しおりが正しく表示される
- [ ] エラーが発生していない（Vercel Dashboardの「Functions」タブで確認）

---

## 継続的デプロイ

Vercelは自動的に継続的デプロイを設定します：

1. **main**ブランチにプッシュ → 本番環境に自動デプロイ
2. その他のブランチにプッシュ → プレビュー環境にデプロイ
3. Pull Request作成 → プレビュー環境にデプロイ（コメントにURLが表示される）

---

## サポートリソース

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.jsデプロイガイド](https://nextjs.org/docs/deployment)
- [NextAuth.jsデプロイガイド](https://next-auth.js.org/deployment)
- [Vercelサポート](https://vercel.com/support)

---

**最終更新**: 2025-10-07
**対応Phase**: Phase 10 - デプロイ・運用