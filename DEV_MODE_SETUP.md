# 開発モードセットアップガイド

Phase 3のAI機能を**認証なし**でテストする方法を説明します。

## 🚀 クイックスタート（認証バイパス）

### ステップ1: 環境変数の設定

`.env.local`ファイルに以下を追加：

```bash
# 必須: Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# 開発モード（認証をバイパス）
NEXT_PUBLIC_DEV_MODE=true

# 以下は開発モードでは不要（認証をスキップするため）
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

**重要**: `NEXT_PUBLIC_DEV_MODE=true` を設定すると、認証なしでアプリにアクセスできます。

### ステップ2: サーバーの起動

```bash
npm run dev
```

### ステップ3: ブラウザで開く

```
http://localhost:3000
```

これで、**ログインなし**でチャット機能をテストできます！

---

## 📝 詳細説明

### 開発モードとは？

`NEXT_PUBLIC_DEV_MODE=true` を設定すると：

✅ 認証チェックがスキップされる  
✅ ログイン不要でメインページにアクセス可能  
✅ チャットAPIが認証なしで使える  
✅ Phase 3のAI機能を即座にテスト可能  

⚠️ **本番環境では絶対に使用しないでください！**

---

## 🔧 環境変数の詳細

### 最小構成（開発モード）

```bash
# .env.local

# 必須
GEMINI_API_KEY=your_gemini_api_key_here

# 開発モード有効化
NEXT_PUBLIC_DEV_MODE=true
```

これだけで動作します！

### 完全な構成（認証あり）

認証機能もテストしたい場合：

```bash
# .env.local

# Gemini API（必須）
GEMINI_API_KEY=your_gemini_api_key_here

# 認証設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 開発モードを無効化（認証を有効化）
NEXT_PUBLIC_DEV_MODE=false
```

---

## 🧪 テスト手順

### 1. 開発モードでテスト（認証なし）

```bash
# 1. .env.localを設定
echo "GEMINI_API_KEY=your_key" > .env.local
echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local

# 2. サーバー起動
npm run dev

# 3. ブラウザで開く
# http://localhost:3000

# 4. チャットで「東京で3日間の旅行計画」と入力
```

### 2. 自動テストの実行

```bash
# サーバーを起動（別のターミナル）
npm run dev

# テストを実行
./test-phase3.sh
```

### 3. ブラウザテストツール

```
http://localhost:3000/test-api.html
```

すべてのAPI機能を視覚的にテストできます。

---

## 🐛 トラブルシューティング

### 問題: まだログインページにリダイレクトされる

**解決方法:**

```bash
# 1. .env.localを確認
cat .env.local | grep NEXT_PUBLIC_DEV_MODE

# 2. 値が正しいか確認
# NEXT_PUBLIC_DEV_MODE=true

# 3. サーバーを再起動
# Ctrl+C でサーバーを停止
npm run dev
```

**重要**: `NEXT_PUBLIC_`プレフィックスの環境変数を変更した場合は、**必ずサーバーを再起動**してください。

### 問題: テキストボックスが無効のまま

**原因チェック:**

1. **ローディング状態?**
   - ブラウザのコンソールを確認
   - ネットワークタブでAPIエラーを確認

2. **環境変数が反映されていない?**
   ```bash
   # サーバーを完全に停止
   # Ctrl+C を押す
   
   # キャッシュをクリア
   rm -rf .next
   
   # 再起動
   npm run dev
   ```

3. **GEMINI_API_KEYが設定されていない?**
   ```bash
   cat .env.local | grep GEMINI_API_KEY
   ```

### 問題: "GEMINI_API_KEY is not configured"

**解決方法:**

```bash
# APIキーを設定
echo "GEMINI_API_KEY=your_actual_api_key" >> .env.local

# サーバーを再起動
npm run dev
```

---

## 🔒 セキュリティに関する注意

### 開発モードの使用場所

✅ **OK:**
- ローカル開発環境
- 自分のマシンでのテスト
- CI/CDのテスト環境（制限されたアクセス）

❌ **NG:**
- 本番環境
- ステージング環境（外部アクセス可能）
- 公開サーバー
- デモサイト

### 本番環境への移行

本番環境では**必ず**開発モードを無効化してください：

```bash
# .env.production

# 開発モードを無効化（または削除）
NEXT_PUBLIC_DEV_MODE=false

# 認証設定を正しく設定
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=secure_random_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 📊 モード比較

| 機能 | 開発モード | 本番モード |
|------|-----------|-----------|
| 認証チェック | スキップ | 必須 |
| ログイン | 不要 | 必須 |
| Google OAuth | 不要 | 必須 |
| APIアクセス | 自由 | 認証必須 |
| テストの容易さ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| セキュリティ | ⚠️ 低 | ✅ 高 |

---

## 🎯 推奨ワークフロー

### Phase 3 開発時（AI機能のテスト）

```bash
# 開発モードで起動
NEXT_PUBLIC_DEV_MODE=true npm run dev
```

または

```bash
# .env.localに設定
echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local
npm run dev
```

### Phase 2 開発時（認証機能のテスト）

```bash
# 開発モードを無効化
# .env.localから NEXT_PUBLIC_DEV_MODE=true を削除
npm run dev
```

### 本番デプロイ時

```bash
# .envファイルから DEV_MODE を完全に削除
# または明示的に false に設定
NEXT_PUBLIC_DEV_MODE=false
```

---

## ✅ チェックリスト

Phase 3をテストする前に確認：

- [ ] `.env.local` ファイルが存在する
- [ ] `GEMINI_API_KEY` が設定されている
- [ ] `NEXT_PUBLIC_DEV_MODE=true` が設定されている
- [ ] サーバーを再起動した
- [ ] ブラウザのキャッシュをクリアした（必要に応じて）

すべてチェックできたら：

```bash
npm run dev
# http://localhost:3000 を開く
# チャットでメッセージを送信
```

---

## 📚 関連ドキュメント

- **[テストクイックスタート](./TESTING_QUICKSTART.md)** - テスト方法の概要
- **[完全テストガイド](./docs/PHASE3_TESTING_GUIDE.md)** - 詳細なテスト手順
- **[統合完了レポート](./docs/PHASE3_INTEGRATION_COMPLETE.md)** - 実装内容

---

**作成日**: 2025-10-07  
**対象**: Phase 3 開発・テスト環境
