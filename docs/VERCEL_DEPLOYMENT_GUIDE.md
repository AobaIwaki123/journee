# Vercelデプロイ手順書

このドキュメントでは、JourneeアプリケーションをVercelにデプロイする手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [事前準備](#事前準備)
3. [Vercelプロジェクトの作成](#vercelプロジェクトの作成)
4. [環境変数の設定](#環境変数の設定)
5. [デプロイの実行](#デプロイの実行)
6. [デプロイ後の確認](#デプロイ後の確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

以下の準備が完了していることを確認してください：

- ✅ GitHubアカウント
- ✅ Vercelアカウント（[vercel.com](https://vercel.com)で無料登録）
- ✅ Google Cloud Platformアカウント（OAuth認証用）
- ✅ Google AI Studio アカウント（Gemini API用）
- ✅ （オプション）Anthropic アカウント（Claude API用）

---

## 事前準備

### 1. GitHubリポジトリの作成

プロジェクトをGitHubにプッシュします。

```bash
# リポジトリの初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリにプッシュ
git remote add origin https://github.com/YOUR_USERNAME/journee.git
git branch -M main
git push -u origin main
```

### 2. 必要なAPIキーの取得

#### 2.1 Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. **「APIとサービス」→「認証情報」** に移動
4. **「認証情報を作成」→「OAuthクライアントID」** を選択
5. アプリケーションの種類：**「ウェブアプリケーション」**
6. 以下を設定：
   - **名前**: `Journee Production`
   - **承認済みのJavaScript生成元**: 
     - `https://your-app-name.vercel.app`（後で追加可）
   - **承認済みのリダイレクトURI**: 
     - `https://your-app-name.vercel.app/api/auth/callback/google`（後で追加可）
7. **クライアントID** と **クライアントシークレット** をコピーして保存

> **注意**: デプロイ後にVercelのURLが確定してから、リダイレクトURIを更新する必要があります。

#### 2.2 Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. **「Get API Key」** をクリック
3. APIキーをコピーして保存

#### 2.3 NextAuth Secret の生成

ターミナルで以下のコマンドを実行してランダムな文字列を生成：

```bash
openssl rand -base64 32
```

または、オンラインツール: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

---

## Vercelプロジェクトの作成

### 1. Vercelにログイン

[vercel.com](https://vercel.com) にアクセスし、GitHubアカウントでログインします。

### 2. 新規プロジェクトのインポート

1. **「Add New...」→「Project」** をクリック
2. **「Import Git Repository」** でGitHubリポジトリを選択
3. リポジトリ名 `journee` を検索して **「Import」** をクリック

### 3. プロジェクト設定

#### Framework Preset
- **Framework Preset**: `Next.js` （自動検出されます）

#### Root Directory
- **Root Directory**: `.` （デフォルトのまま）

#### Build and Output Settings
- **Build Command**: `npm run build` （デフォルト）
- **Output Directory**: `.next` （デフォルト）
- **Install Command**: `npm install` （デフォルト）

#### Node.js Version
- **Node.js Version**: `18.x` または `20.x`

> **重要**: まだ **「Deploy」をクリックしないでください！** 先に環境変数を設定します。

---

## 環境変数の設定

Vercelプロジェクト設定画面で、**「Environment Variables」** セクションに以下の環境変数を追加します。

### 必須の環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | デプロイ後のURL（初回は仮のURLで可） |
| `NEXTAUTH_SECRET` | `（生成したシークレット）` | NextAuth.js用のシークレットキー |
| `GOOGLE_CLIENT_ID` | `（Google OAuthのクライアントID）` | Google OAuth認証用 |
| `GOOGLE_CLIENT_SECRET` | `（Google OAuthのクライアントシークレット）` | Google OAuth認証用 |
| `GEMINI_API_KEY` | `（Gemini APIキー）` | Google Gemini AI用 |

### オプションの環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `（Google Maps APIキー）` | 地図機能用（将来実装予定） |

### 環境変数の追加方法

1. **Key（キー）**: 環境変数名を入力（例: `NEXTAUTH_URL`）
2. **Value（値）**: 対応する値を入力
3. **Environment**: すべてにチェック（Production, Preview, Development）
4. **「Add」** をクリック

すべての環境変数を追加したら、画面下部の **「Deploy」** をクリックします。

---

## デプロイの実行

### 1. 初回デプロイ

**「Deploy」** をクリックすると、ビルドプロセスが開始されます。

ビルドログをリアルタイムで確認できます：
- ✅ 依存関係のインストール
- ✅ TypeScriptのコンパイル
- ✅ Next.jsのビルド
- ✅ デプロイ完了

### 2. デプロイURL の確認

デプロイが完了すると、以下のURLが発行されます：

```
https://journee-xxxxx.vercel.app
```

このURLをコピーしておきます。

### 3. Google OAuth のリダイレクトURI更新

1. [Google Cloud Console](https://console.cloud.google.com/) に戻る
2. **「APIとサービス」→「認証情報」** に移動
3. 作成したOAuthクライアントIDを選択
4. **「承認済みのリダイレクトURI」** に以下を追加：
   ```
   https://journee-xxxxx.vercel.app/api/auth/callback/google
   ```
5. **「保存」** をクリック

### 4. NEXTAUTH_URL の更新

Vercelダッシュボードに戻り：

1. プロジェクト → **「Settings」→「Environment Variables」**
2. `NEXTAUTH_URL` を探して **「Edit」** をクリック
3. 値を実際のデプロイURLに更新：
   ```
   https://journee-xxxxx.vercel.app
   ```
4. **「Save」** をクリック
5. **「Deployments」** タブに移動して **「Redeploy」** を実行

---

## デプロイ後の確認

### 1. 基本動作確認

ブラウザでデプロイURLにアクセスし、以下を確認：

- ✅ ログインページが表示される
- ✅ Googleログインが正常に動作する
- ✅ 認証後にメインページが表示される
- ✅ チャット機能が動作する
- ✅ AIレスポンスが正常に返ってくる
- ✅ しおりが正しく表示される

### 2. ヘルスチェック

以下のAPIエンドポイントにアクセスして動作確認：

```
https://journee-xxxxx.vercel.app/api/health
```

正常な場合のレスポンス：
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### 3. ログの確認

Vercelダッシュボードで **「Functions」** タブを開き、ログを確認：
- エラーがないか
- API呼び出しが正常に処理されているか

---

## カスタムドメインの設定（オプション）

### 1. ドメインの追加

Vercelプロジェクト → **「Settings」→「Domains」**

1. **「Add Domain」** をクリック
2. ドメイン名を入力（例: `journee.example.com`）
3. DNSレコードの設定指示に従う

### 2. DNSレコードの設定

ドメインレジストラ（お名前.com、Google Domains等）で以下を設定：

**Aレコード**:
```
Type: A
Name: @（またはサブドメイン）
Value: 76.76.21.21
```

**CNAMEレコード**（サブドメインの場合）:
```
Type: CNAME
Name: www（または任意のサブドメイン）
Value: cname.vercel-dns.com
```

### 3. SSL証明書

Vercelが自動的にSSL証明書を発行します（Let's Encrypt）。
通常、数分〜数時間で完了します。

### 4. Google OAuthの更新

カスタムドメインを追加した場合、Google OAuth設定も更新：

1. **承認済みのJavaScript生成元**:
   ```
   https://journee.example.com
   ```

2. **承認済みのリダイレクトURI**:
   ```
   https://journee.example.com/api/auth/callback/google
   ```

### 5. 環境変数の更新

`NEXTAUTH_URL` をカスタムドメインに更新：
```
NEXTAUTH_URL=https://journee.example.com
```

---

## 継続的デプロイ（CI/CD）

Vercelは、GitHubと自動的に連携します：

### 1. 自動デプロイ

- **main/masterブランチ**: 本番環境に自動デプロイ
- **その他のブランチ**: プレビューデプロイ（Preview URL発行）
- **Pull Request**: プレビューデプロイ + コメント投稿

### 2. プレビューデプロイの確認

1. 開発ブランチでコードを変更
2. GitHubにプッシュ
3. Vercelが自動的にプレビューURLを生成
4. プレビュー環境で動作確認
5. 問題なければmainブランチにマージ → 本番デプロイ

---

## トラブルシューティング

### 問題1: ビルドエラー

**症状**: `next build` が失敗する

**解決策**:
```bash
# ローカルでビルドを確認
npm run build

# 型エラーがある場合
npm run type-check

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

### 問題2: 環境変数が読み込まれない

**症状**: APIキーが undefined

**解決策**:
1. Vercel ダッシュボードで環境変数を確認
2. すべての環境（Production, Preview, Development）にチェックが入っているか
3. 変数名が正確か（大文字小文字も含む）
4. 再デプロイを実行

### 問題3: Google OAuth認証エラー

**症状**: `redirect_uri_mismatch` エラー

**解決策**:
1. Google Cloud ConsoleでリダイレクトURIを確認
2. 以下の形式で正確に登録されているか確認:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
3. `NEXTAUTH_URL` が正しいか確認
4. 再デプロイ

### 問題4: APIタイムアウト

**症状**: Gemini/Claude APIがタイムアウト

**解決策**:
1. Vercelの無料プランではAPIルートのタイムアウトは10秒
2. Pro プランではタイムアウトを60秒まで延長可能
3. ストリーミングレスポンスを使用しているか確認

### 問題5: ログインループ

**症状**: ログイン後にログインページに戻される

**解決策**:
1. `NEXTAUTH_SECRET` が設定されているか確認
2. `NEXTAUTH_URL` が正確か確認（末尾のスラッシュなし）
3. Cookieの設定を確認（HTTPSで動作しているか）

---

## パフォーマンス最適化

### 1. エッジ機能の活用

`middleware.ts` でエッジランタイムを使用：
```typescript
export const config = {
  runtime: 'edge', // Edgeランタイムを使用
};
```

### 2. 画像の最適化

Next.js Imageコンポーネントを使用することで、Vercelが自動的に画像を最適化します。

### 3. キャッシュ戦略

```typescript
// app/api/route.ts
export const runtime = 'edge';
export const revalidate = 3600; // 1時間ごとに再検証
```

---

## モニタリング・ログ

### 1. Vercel Analytics

Vercelダッシュボードで **「Analytics」** タブを開く：
- ページビュー数
- ユーザー数
- デバイス分布
- 地域分布

### 2. ログの確認

**「Functions」** タブでログを確認：
- リアルタイムログ
- エラーログ
- パフォーマンスメトリクス

### 3. エラートラッキング（推奨）

[Sentry](https://sentry.io/) などのエラートラッキングツールの導入を推奨：

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## セキュリティ設定

### 1. セキュリティヘッダー

`next.config.js` にセキュリティヘッダーを追加：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... 既存の設定

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. 環境変数の保護

- ✅ APIキーは環境変数で管理
- ✅ クライアントに公開する変数は `NEXT_PUBLIC_` プレフィックスをつける
- ✅ `.env.local` は `.gitignore` に追加済み

---

## バックアップ・ロールバック

### 1. バックアップ

Vercelは自動的にすべてのデプロイメントを保存します。

### 2. ロールバック

1. **「Deployments」** タブを開く
2. 以前のデプロイメントを選択
3. **「Promote to Production」** をクリック

---

## まとめ

✅ **デプロイ完了チェックリスト**:

- [ ] GitHubリポジトリにプッシュ
- [ ] Google OAuth設定完了
- [ ] Gemini APIキー取得
- [ ] Vercelプロジェクト作成
- [ ] 環境変数を設定
- [ ] デプロイ実行
- [ ] Google OAuthリダイレクトURI更新
- [ ] 動作確認（ログイン、チャット、しおり）
- [ ] カスタムドメイン設定（オプション）
- [ ] モニタリング設定

---

## 関連ドキュメント

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.js デプロイガイド](https://nextjs.org/docs/deployment)
- [NextAuth.js デプロイガイド](https://next-auth.js.org/deployment)
- [プロジェクトREADME](../README.md)
- [クイックスタートガイド](./QUICK_START.md)

---

**最終更新**: 2025-10-07

**問題が発生した場合**: [GitHub Issues](https://github.com/YOUR_USERNAME/journee/issues) でサポートを依頼してください。
