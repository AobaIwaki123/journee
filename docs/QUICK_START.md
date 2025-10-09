# Journee クイックスタートガイド

このガイドでは、Journeeアプリケーションをローカル環境で動かす手順を説明します。

## 📋 前提条件

- Node.js 18.0以降
- npm または yarn
- Googleアカウント（OAuth設定用）

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
```

#### NEXTAUTH_SECRETの生成方法

```bash
openssl rand -base64 32
```

出力された文字列をコピーして `NEXTAUTH_SECRET` に設定してください。

---

## 🔑 Google OAuth設定

> **💡 開発時のヒント**: Google OAuth設定が面倒な場合は、[モック認証機能](#-モック認証ブランチモード)を使用することで、この手順をスキップできます。

### 1. Google Cloud Consoleにアクセス

[Google Cloud Console](https://console.cloud.google.com/) にアクセスしてログインします。

### 2. プロジェクトの作成

1. 上部のプロジェクト選択ドロップダウンをクリック
2. 「新しいプロジェクト」を選択
3. プロジェクト名を入力（例: journee-dev）
4. 「作成」をクリック

### 3. OAuth同意画面の設定

1. 左側メニューから「APIとサービス」→「OAuth同意画面」を選択
2. 「外部」を選択して「作成」をクリック
3. 以下の項目を入力：
   - **アプリ名**: Journee
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
4. 「保存して次へ」をクリック
5. スコープは設定不要なので「保存して次へ」
6. テストユーザーを追加（あなたのGoogleアカウント）
7. 「保存して次へ」→「ダッシュボードに戻る」

### 4. OAuth 2.0クライアントIDの作成

1. 左側メニューから「APIとサービス」→「認証情報」を選択
2. 上部の「+認証情報を作成」→「OAuth クライアントID」を選択
3. アプリケーションの種類：「ウェブアプリケーション」
4. 名前：「Journee Web Client」
5. **承認済みのリダイレクトURI**に以下を追加：
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. 「作成」をクリック

### 5. 認証情報をコピー

1. クライアントIDとクライアントシークレットが表示されます
2. これらをコピーして `.env.local` に貼り付けます：
   ```env
   GOOGLE_CLIENT_ID=<ここにクライアントID>
   GOOGLE_CLIENT_SECRET=<ここにクライアントシークレット>
   ```

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

1. ブラウザで `http://localhost:3000` にアクセス
2. 自動的にログインページにリダイレクトされます
3. 「Googleでログイン」ボタンをクリック
4. Googleアカウントを選択して認証
5. メインページにリダイレクトされます

### 2. ユーザーメニュー

1. 右上のアバター画像をクリック
2. ドロップダウンメニューが表示されます
3. ユーザー名とメールアドレスが表示されていることを確認

### 3. ログアウト

1. ユーザーメニューから「ログアウト」をクリック
2. ログインページにリダイレクトされます

---

## 🎯 現在利用可能な機能

### ✅ Phase 1 & 2 実装済み

- **認証システム**
  - Googleアカウントでログイン
  - セッション管理
  - 自動ログインチェック

- **基本レイアウト**
  - ヘッダーナビゲーション
  - ユーザーメニュー
  - 左右分割レイアウト（チャット/プレビュー）

### 🚧 次フェーズで実装予定

- **Phase 3**: AIチャット機能
- **Phase 4**: しおり保存機能
- **Phase 5**: しおり詳細表示

---

## 🐛 トラブルシューティング

### 問題: ログインできない

**原因**: Google OAuthの設定が正しくない

**解決方法**:
1. `.env.local` のクライアントIDとシークレットを確認
2. Google Cloud Consoleでリダイレクトが正しく設定されているか確認
3. ブラウザのCookieをクリア

### 問題: "Invalid redirect URI"エラー

**原因**: リダイレクトURIが正しく設定されていない

**解決方法**:
1. Google Cloud Consoleの認証情報を確認
2. リダイレクトURIに以下が含まれているか確認：
   ```
   http://localhost:3000/api/auth/callback/google
   ```
3. 末尾のスラッシュがないことを確認

### 問題: セッションが保存されない

**原因**: `NEXTAUTH_SECRET` が設定されていない

**解決方法**:
1. `.env.local` に `NEXTAUTH_SECRET` が設定されているか確認
2. 開発サーバーを再起動

### 問題: ページが真っ白

**原因**: ビルドエラーまたはJavaScriptエラー

**解決方法**:
1. ブラウザの開発者ツールでコンソールエラーを確認
2. ターミナルのエラーメッセージを確認
3. 依存関係を再インストール：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📚 詳細ドキュメント

- [API仕様書](./API.md)
- [Phase 1 & 2 統合レポート](./PHASE1_PHASE2_INTEGRATION.md)
- [Phase 2 実装レポート](./PHASE2_IMPLEMENTATION.md)

---

## 💡 開発のヒント

### ホットリロード

ファイルを編集すると自動的にブラウザが更新されます。

### TypeScriptエラーチェック

```bash
npm run build
```

### Lintチェック

```bash
npm run lint
```

### 開発者ツール

- **React Developer Tools**: コンポーネント構造の確認
- **Redux DevTools**: 状態管理の確認（Phase 3以降）

---

## 🎉 次のステップ

Phase 1 & 2の実装が完了しました！

次は **Phase 3: AI統合** で以下を実装します：

- Gemini API統合
- チャット機能
- リアルタイムAI応答
- しおりデータの構造化

開発に参加したい方は、issueまたはPull Requestをお待ちしています！

---

## 🧪 モック認証（ブランチモード）

開発・テスト環境でGoogle OAuth設定をスキップしたい場合は、モック認証機能を使用できます。

### 有効化方法

`.env.local` に以下を追加：

```env
ENABLE_MOCK_AUTH=true
NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
```

### 使い方

1. アプリを起動: `npm run dev`
2. ログインページ（`http://localhost:3000/login`）にアクセス
3. 「テストユーザーでログイン」ボタンをクリック
4. 即座にログイン完了！

**全機能が利用可能**：モックユーザーは初回ログイン時にSupabaseに自動登録されるため、しおりの保存・公開・削除などすべての機能が正常に動作します。

### オプション：事前登録

モックユーザーを事前に一括登録する場合：

```bash
npm run seed:mock-users
```

### 注意事項

- **本番環境では絶対に有効化しないでください**
- モック認証が有効な場合、Google OAuthは無効化されます
- 詳細: [MOCK_AUTH.md](./MOCK_AUTH.md)

---

**Happy Coding! 🚀**
