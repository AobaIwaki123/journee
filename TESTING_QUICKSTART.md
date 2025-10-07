# Phase 3 テスト クイックスタート

Phase 3のAI統合機能をテストする最も簡単な方法を説明します。

## 🚀 3つのテスト方法

### 方法1: ブラウザテストツール（最も簡単）

1. **開発サーバーを起動**
```bash
npm run dev
```

2. **ブラウザでテストページを開く**
```
http://localhost:3000/test-api.html
```

3. **各テストボタンをクリック**
   - ✅ ヘルスチェック
   - ✅ シンプルなチャット
   - ✅ 旅行計画作成
   - ✅ ストリーミングチャット
   - ✅ エラーハンドリング

**メリット**: 視覚的でわかりやすい、ストリーミングを確認できる

---

### 方法2: 自動テストスクリプト（推奨）

1. **開発サーバーを起動**
```bash
npm run dev
```

2. **別のターミナルでテストスクリプトを実行**
```bash
./test-phase3.sh
```

**出力例:**
```
🧪 Phase 3 統合テスト
==========================================

📋 Step 1: Environment Check
✅ .env.local exists
✅ GEMINI_API_KEY is set

🚀 Step 2: Server Check
✅ Server is running on http://localhost:3000

🔌 Step 3: API Endpoint Tests
  [1] Health check... ✅ PASSED
  [2] Chat API - Simple greeting... ✅ PASSED
  [3] Chat API - Travel planning... ✅ PASSED

==========================================
📊 Test Results Summary
==========================================

  Total Tests:  8
  Passed:       8
  Failed:       0

  Success Rate: 100%

==========================================
🎉 All tests passed!
==========================================
```

**メリット**: 自動化、CI/CDに組み込める

---

### 方法3: 実際のアプリでテスト（実運用テスト）

1. **開発サーバーを起動**
```bash
npm run dev
```

2. **ブラウザでアプリを開く**
```
http://localhost:3000
```

3. **Googleアカウントでログイン**

4. **チャットで旅行計画を作成**
   - 「東京で3日間の旅行計画を立てたいです」と入力
   - ストリーミングでAIの応答を確認
   - 右側にしおりが表示されることを確認

**メリット**: 実際のユーザー体験を確認できる

---

## 📋 最小限のテストチェックリスト

### 環境確認
```bash
# 環境変数を確認
cat .env.local | grep GEMINI_API_KEY

# 依存関係を確認
npm list @google/generative-ai
```

### 基本テスト（5分）
1. ✅ 開発サーバーが起動する
2. ✅ ヘルスチェックが成功する
3. ✅ チャットメッセージを送信できる
4. ✅ AIの応答が表示される
5. ✅ しおりが生成される

### 完全テスト（15分）
上記 + 
6. ✅ ストリーミングが動作する
7. ✅ しおりの更新ができる
8. ✅ エラーハンドリングが動作する
9. ✅ チャット履歴が保持される
10. ✅ ローディング状態が表示される

---

## 🐛 問題が発生したら

### エラー: "GEMINI_API_KEY is not configured"
```bash
# APIキーを確認
cat .env.local | grep GEMINI_API_KEY

# なければ追加
echo "GEMINI_API_KEY=your_api_key" >> .env.local

# サーバーを再起動
npm run dev
```

### エラー: "Server is not running"
```bash
# サーバーを起動
npm run dev

# 別のターミナルでテストを実行
./test-phase3.sh
```

### エラー: ストリーミングが動作しない
```bash
# ブラウザのキャッシュをクリア
# または
# シークレットモードで開く
```

---

## 📚 詳細なテストガイド

より詳しいテスト方法は以下を参照してください:

- **[完全テストガイド](./docs/PHASE3_TESTING_GUIDE.md)** - 全テストケースとトラブルシューティング
- **[統合完了レポート](./docs/PHASE3_INTEGRATION_COMPLETE.md)** - 実装内容と技術詳細
- **[API ドキュメント](./PHASE3_API_DOCUMENTATION.md)** - API仕様と使用例

---

## ⚡ クイックテストコマンド

```bash
# 1. ワンライナーでヘルスチェック
curl http://localhost:3000/api/health

# 2. シンプルなチャット
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"こんにちは","stream":false}'

# 3. 旅行計画作成
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"東京で3日間","stream":false}' | jq '.itinerary.title'

# 4. ストリーミング
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"京都で2日間","stream":true}' --no-buffer
```

---

## ✅ テスト完了の確認

以下がすべて成功したらPhase 3は正常に動作しています:

- [x] ヘルスチェックが成功
- [x] チャットメッセージを送受信できる
- [x] しおりが生成される
- [x] ストリーミングが動作する
- [x] エラーが適切に処理される

**おめでとうございます！Phase 3のテストが完了しました！🎉**

---

**作成日**: 2025-10-07  
**対象**: Phase 3 統合版
