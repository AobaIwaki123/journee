# Journee クイックスタートガイド

このガイドでは、Journeeアプリケーションをローカル環境で動かす手順を説明します。

## 📋 前提条件

- Node.js 18.0以降
- npm または yarn
- Googleアカウント（OAuth設定用、またはモック認証でスキップ可能）

---

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
cp .env.example .env.local
```

`.env.local` を編集して以下の値を設定：

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<ランダムな文字列>

# Google OAuth
GOOGLE_CLIENT_ID=<Google CloudのクライアントID>
GOOGLE_CLIENT_SECRET=<Google Cloudのクライアントシークレット>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase Anon Key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase Service Role Key>

# Google APIs
GEMINI_API_KEY=<Gemini APIキー>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<Google Maps APIキー>
```

#### NEXTAUTH_SECRETの生成方法

```bash
openssl rand -base64 32
```

---

## 🔑 Google OAuth設定

> **💡 ヒント**: Google OAuth設定が面倒な場合は、[モック認証機能](#-モック認証ブランチモード)を使用してこの手順をスキップできます。

### 1. Google Cloud Console

[Google Cloud Console](https://console.cloud.google.com/)にアクセスして新しいプロジェクトを作成。

### 2. OAuth同意画面の設定

1. 「APIとサービス」→「OAuth同意画面」
2. 「外部」を選択
3. アプリ名、サポートメール、デベロッパー連絡先を入力
4. テストユーザーを追加（自分のGoogleアカウント）

### 3. OAuth 2.0クライアントID作成

1. 「APIとサービス」→「認証情報」
2. 「+認証情報を作成」→「OAuth クライアントID」
3. アプリケーションの種類：「ウェブアプリケーション」
4. **承認済みのリダイレクトURI**に以下を追加：
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. クライアントIDとシークレットを`.env.local`に貼り付け

---

## 🏃 アプリケーションの起動

### 開発サーバーを起動

```bash
npm run dev
```

### ブラウザでアクセス

```
http://localhost:3000
```

---

## ✅ 動作確認

### 1. ログイン

1. `http://localhost:3000` にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントを選択して認証

### 2. ユーザーメニュー

1. 右上のアバター画像をクリック
2. ユーザー名とメールアドレスが表示されることを確認

### 3. ログアウト

ユーザーメニューから「ログアウト」をクリック

---

## 🎯 現在利用可能な機能

### ✅ Phase 1-10 実装済み

- **認証システム**: Googleアカウントログイン、セッション管理
- **基本レイアウト**: ヘッダーナビゲーション、左右分割レイアウト
- **AIチャット機能**: Gemini/Claude対応、リアルタイム応答
- **しおり機能**: 作成・編集・保存・共有・PDF出力
- **データベース統合**: Supabase (PostgreSQL)、データマイグレーション
- **公開・共有**: 公開URL発行、OGP画像動的生成

---

## 🐛 トラブルシューティング

### ログインできない

**解決方法**:
1. `.env.local`のクライアントIDとシークレットを確認
2. Google Cloud Consoleでリダイレクト設定確認
3. ブラウザCookieをクリア

### "Invalid redirect URI"エラー

**解決方法**:
リダイレクトURIが`http://localhost:3000/api/auth/callback/google`であることを確認（末尾スラッシュなし）

### セッションが保存されない

**解決方法**:
1. `.env.local`に`NEXTAUTH_SECRET`が設定されているか確認
2. 開発サーバーを再起動

### ページが真っ白

**解決方法**:
1. ブラウザの開発者ツールでコンソールエラーを確認
2. 依存関係を再インストール：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📚 詳細ドキュメント

- [API仕様書](./API.md)
- [実装計画](./PLAN.md)
- [コーディングガイドライン](./GUIDELINE.md)
- [データベーススキーマ](./SCHEMA.md)

---

## 💡 開発のヒント

### コマンド一覧

```bash
npm run dev          # 開発サーバー起動
npm run build        # TypeScriptエラーチェック
npm run lint         # Lintチェック
npm test             # テスト実行
```

### 開発者ツール

- **React Developer Tools**: コンポーネント構造確認
- **Redux DevTools**: 状態管理確認（Zustand）

---

## 🧪 モック認証（ブランチモード）

開発・テスト環境でGoogle OAuth設定をスキップ。

### 有効化方法

`.env.local`に追加：

```env
ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

### 使い方

1. アプリを起動: `npm run dev`
2. ログインページ（`http://localhost:3000/login`）にアクセス
3. 「テストユーザーでログイン」ボタンをクリック
4. 即座にログイン完了！

**全機能利用可能**: モックユーザーは初回ログイン時にSupabaseに自動登録されるため、しおりの保存・公開・削除などすべての機能が動作します。

### オプション：事前登録

```bash
npm run seed:mock-users
```

### 注意事項

- **本番環境では絶対に有効化しないでください**
- モック認証有効時、Google OAuthは無効化されます
- 詳細: [MOCK_AUTH.md](./MOCK_AUTH.md)

---

## 🎉 次のステップ

開発に参加したい方は、issueまたはPull Requestをお待ちしています！

---

**Happy Coding! 🚀**
