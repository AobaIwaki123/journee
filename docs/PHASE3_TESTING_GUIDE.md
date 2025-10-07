# Phase 3: AI API 統合 テストガイド

このガイドでは、Phase 3で実装したAI機能のテスト方法を段階的に説明します。

## 📋 目次

1. [環境セットアップのテスト](#1-環境セットアップのテスト)
2. [Gemini APIの直接テスト](#2-gemini-apiの直接テスト)
3. [APIエンドポイントのテスト](#3-apiエンドポイントのテスト)
4. [UIテスト（ブラウザ）](#4-uiテストブラウザ)
5. [ストリーミング機能のテスト](#5-ストリーミング機能のテスト)
6. [エラーハンドリングのテスト](#6-エラーハンドリングのテスト)
7. [統合テスト](#7-統合テスト)

---

## 1. 環境セットアップのテスト

### 1.1 環境変数の確認

```bash
# .env.localファイルが存在するか確認
ls -la .env.local

# 環境変数の内容を確認（APIキーは表示されません）
cat .env.local
```

必要な環境変数:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 1.2 依存関係の確認

```bash
# 依存関係がインストールされているか確認
npm list @google/generative-ai
npm list zustand
npm list lucide-react
```

期待される出力:
```
├── @google/generative-ai@0.21.0
├── zustand@4.5.7
└── lucide-react@0.344.0
```

### 1.3 TypeScriptの型チェック

```bash
# 型エラーがないか確認
npm run type-check
```

期待される出力: エラーなし

---

## 2. Gemini APIの直接テスト

### 2.1 テストスクリプトの実行

Gemini APIクライアントを直接テストします。

```bash
# Node.jsで直接実行（.envファイルを読み込むために）
node -r dotenv/config -e "
require('dotenv').config({ path: '.env.local' });
const { sendGeminiMessage } = require('./lib/ai/gemini.ts');

async function test() {
  try {
    const result = await sendGeminiMessage(
      '東京で3日間の旅行計画を立てたいです',
      [],
      undefined
    );
    console.log('✅ Success!');
    console.log('Message:', result.message);
    console.log('Has Itinerary:', !!result.itinerary);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
"
```

### 2.2 簡易テストスクリプトの作成

```bash
# テストスクリプトを作成
cat > test-gemini.mjs << 'EOF'
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not set');
  process.exit(1);
}

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: 'gemini-1.5-pro' });

async function test() {
  try {
    console.log('🚀 Testing Gemini API...\n');
    
    const result = await model.generateContent('こんにちは。東京の観光名所を3つ教えてください。');
    const text = result.response.text();
    
    console.log('✅ API Response:');
    console.log(text);
    console.log('\n✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# 実行
GEMINI_API_KEY=$(grep GEMINI_API_KEY .env.local | cut -d '=' -f2) node test-gemini.mjs
```

---

## 3. APIエンドポイントのテスト

### 3.1 開発サーバーの起動

```bash
# 別のターミナルで開発サーバーを起動
npm run dev
```

サーバーが起動したら、次のテストを実行します。

### 3.2 ヘルスチェック

```bash
# サーバーが起動しているか確認
curl http://localhost:3000/api/health
```

期待される出力:
```json
{"status":"ok","timestamp":"2025-10-07T..."}
```

### 3.3 チャットAPI（非ストリーミング）のテスト

```bash
# シンプルなメッセージテスト
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは",
    "stream": false
  }' | jq '.'
```

期待される出力:
```json
{
  "message": "こんにちは！旅行計画のお手伝いをさせていただきます。...",
  "model": "gemini"
}
```

### 3.4 旅行計画作成のテスト

```bash
# 旅行計画を作成
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "東京で3日間の旅行計画を立てたいです。浅草、スカイツリー、渋谷を回りたいです。",
    "stream": false
  }' | jq '.itinerary.title, .itinerary.destination, .itinerary.schedule[].day'
```

期待される出力（例）:
```
"東京3日間の旅"
"東京"
1
2
3
```

### 3.5 既存しおりの更新テスト

```bash
# まず既存のしおりデータを準備
cat > /tmp/itinerary.json << 'EOF'
{
  "id": "test-123",
  "title": "東京2日間の旅",
  "destination": "東京",
  "startDate": "2025-11-01",
  "endDate": "2025-11-02",
  "duration": 2,
  "schedule": [
    {
      "day": 1,
      "date": "2025-11-01",
      "title": "1日目",
      "spots": [
        {
          "id": "spot-1",
          "name": "浅草寺",
          "description": "東京最古の寺院",
          "scheduledTime": "10:00",
          "duration": 90,
          "category": "sightseeing"
        }
      ]
    }
  ],
  "status": "draft",
  "createdAt": "2025-10-07T10:00:00.000Z",
  "updatedAt": "2025-10-07T10:00:00.000Z"
}
EOF

# しおりを更新
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq '.itinerary.schedule[].spots[].name'
{
  "message": "2日目にスカイツリーを追加してください",
  "currentItinerary": $(cat /tmp/itinerary.json),
  "stream": false
}
EOF
```

### 3.6 ストリーミングAPIのテスト

```bash
# ストリーミングレスポンスのテスト
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "京都で2日間の旅行計画を立てたいです",
    "stream": true
  }' --no-buffer
```

期待される出力（リアルタイム）:
```
data: {"type":"message","content":"京都"}
data: {"type":"message","content":"での"}
data: {"type":"message","content":"2日間"}
...
data: {"type":"itinerary","itinerary":{...}}
data: {"type":"done"}
```

---

## 4. UIテスト（ブラウザ）

### 4.1 ログイン機能のテスト

1. ブラウザで http://localhost:3000 を開く
2. ログインページにリダイレクトされることを確認
3. 「Googleでログイン」ボタンをクリック
4. Google認証画面が表示されることを確認
5. 認証後、メインページにリダイレクトされることを確認

### 4.2 チャット機能の基本テスト

**テストケース 1: 初回メッセージ**
1. チャット入力欄に「こんにちは」と入力
2. 送信ボタンをクリック
3. ✅ メッセージが送信される
4. ✅ ローディングアニメーション（ドット）が表示される
5. ✅ AIの応答がストリーミングで表示される
6. ✅ カーソルアニメーション（▋）が表示される
7. ✅ 完了後、メッセージ履歴に追加される

**テストケース 2: 旅行計画作成**
1. 「東京で3日間の旅行計画を立てたいです」と入力
2. 送信
3. ✅ AIが旅程を提案する
4. ✅ 右側にしおりが表示される
5. ✅ 日程が3日分表示される
6. ✅ 各日に観光スポットが表示される

**テストケース 3: しおりの更新**
1. 既存のしおりがある状態で
2. 「2日目に東京タワーを追加してください」と入力
3. ✅ しおりが更新される
4. ✅ 2日目に新しいスポットが追加される

### 4.3 しおりプレビューのテスト

**確認項目:**
- [ ] タイトルが表示される
- [ ] 目的地が表示される
- [ ] 期間（開始日〜終了日）が表示される
- [ ] 日程が順番に表示される
- [ ] 各スポットの名前が表示される
- [ ] スポットの説明が表示される
- [ ] カテゴリバッジ（観光、食事など）が表示される
- [ ] 予定時刻が表示される
- [ ] 予算が表示される（ある場合）
- [ ] 総予算が表示される（ある場合）

### 4.4 UIコンポーネントのテスト

**メッセージリスト:**
- [ ] ユーザーメッセージは右寄せ（青色）
- [ ] AIメッセージは左寄せ（グレー）
- [ ] タイムスタンプが表示される
- [ ] 自動スクロールが動作する
- [ ] ストリーミング中のカーソル表示

**スポットカード:**
- [ ] 時計アイコンが表示される
- [ ] スポット名が表示される
- [ ] カテゴリバッジの色が正しい
  - 観光: 青
  - 食事: オレンジ
  - 移動: 緑
  - 宿泊: 紫
- [ ] ホバーエフェクトが動作する

---

## 5. ストリーミング機能のテスト

### 5.1 ブラウザのデベロッパーツールでテスト

1. ブラウザで F12 を押してデベロッパーツールを開く
2. Network タブを開く
3. チャットでメッセージを送信
4. `/api/chat` リクエストを確認

**確認項目:**
- [ ] Request Method: POST
- [ ] Content-Type: application/json
- [ ] Response Type: text/event-stream
- [ ] Status: 200
- [ ] データがリアルタイムで受信される

### 5.2 JavaScriptコンソールでテスト

ブラウザのコンソールで以下を実行:

```javascript
// ストリーミングテスト
async function testStreaming() {
  console.log('🚀 Starting streaming test...');
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '大阪で2日間の旅行計画を',
      stream: true
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let messageCount = 0;
  let itineraryReceived = false;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'message') {
          messageCount++;
          console.log('📝 Chunk:', data.content);
        } else if (data.type === 'itinerary') {
          itineraryReceived = true;
          console.log('📋 Itinerary received!');
        } else if (data.type === 'done') {
          console.log('✅ Streaming complete!');
        }
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`- Message chunks: ${messageCount}`);
  console.log(`- Itinerary received: ${itineraryReceived}`);
}

testStreaming();
```

---

## 6. エラーハンドリングのテスト

### 6.1 無効なAPIキーのテスト

```bash
# 環境変数を一時的に無効化
GEMINI_API_KEY=invalid_key npm run dev
```

**期待される動作:**
- エラーメッセージが表示される
- エラー通知が右上に表示される
- 5秒後に自動で消える

### 6.2 空のメッセージのテスト

1. チャット入力欄に何も入力しない
2. 送信ボタンをクリック

**期待される動作:**
- [ ] 送信ボタンが無効化されている
- [ ] メッセージが送信されない

### 6.3 ネットワークエラーのテスト

**方法1: デベロッパーツールで**
1. F12 → Network タブ
2. 「Offline」にチェック
3. メッセージを送信

**方法2: サーバーを停止**
1. 開発サーバーを停止（Ctrl+C）
2. ブラウザでメッセージを送信

**期待される動作:**
- [ ] エラーメッセージが表示される
- [ ] エラー通知が表示される
- [ ] 「申し訳ございません。エラーが発生しました」

### 6.4 レート制限のテスト

```bash
# 連続で多数のリクエストを送信
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test","stream":false}' &
done
wait
```

**期待される動作:**
- Gemini APIのレート制限に達する可能性
- エラーハンドリングが正しく動作する

---

## 7. 統合テスト

### 7.1 フルシナリオテスト

**シナリオ: 旅行計画の作成から修正まで**

1. **ログイン**
   - Googleアカウントでログイン
   - メインページが表示される

2. **初回メッセージ**
   - 「こんにちは」と入力
   - AIが応答する

3. **旅行計画作成**
   - 「北海道で3日間の旅行を計画したいです。札幌、小樽、富良野を回りたいです。」
   - しおりが生成される
   - 3日分の日程が表示される

4. **追加依頼**
   - 「1日目に時計台を追加してください」
   - 1日目に時計台が追加される

5. **変更依頼**
   - 「2日目を小樽観光にしてください」
   - 2日目のスケジュールが更新される

6. **詳細確認**
   - 各スポットの詳細が表示される
   - 予算が表示される
   - カテゴリバッジが正しく表示される

### 7.2 パフォーマンステスト

```bash
# 応答時間の測定
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "東京で3日間の旅行計画",
    "stream": false
  }' > /dev/null
```

**期待される結果:**
- ストリーミングなし: 5-15秒
- ストリーミングあり: 最初のチャンク 1-3秒

### 7.3 チャット履歴のテスト

**テストケース: 会話の継続性**

1. 「京都に行きたいです」
2. 「2日間の旅行です」
3. 「清水寺と金閣寺に行きたいです」

**確認項目:**
- [ ] 各メッセージが前の文脈を理解している
- [ ] しおりが段階的に更新される
- [ ] チャット履歴が保持される（最新10件）

---

## 8. 自動テストスクリプト

### 8.1 総合テストスクリプトの作成

```bash
cat > test-phase3.sh << 'EOF'
#!/bin/bash

echo "🧪 Phase 3 統合テスト"
echo "===================="
echo ""

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト結果のカウンター
PASSED=0
FAILED=0

# テスト関数
test_api() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local data=$4
  
  echo -n "Testing: $name... "
  
  if [ -z "$data" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method $url)
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" $url)
  fi
  
  if [ "$response" == "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
    ((FAILED++))
  fi
}

# サーバーが起動しているか確認
echo "1. Checking server..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo -e "${RED}❌ Server is not running!${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# テスト実行
echo "2. Running API tests..."
test_api "Health check" "http://localhost:3000/api/health"
test_api "Chat API (simple)" "http://localhost:3000/api/chat" "POST" '{"message":"こんにちは","stream":false}'
test_api "Chat API (travel plan)" "http://localhost:3000/api/chat" "POST" '{"message":"東京で3日間","stream":false}'

echo ""
echo "===================="
echo "📊 Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "===================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed${NC}"
  exit 1
fi
EOF

chmod +x test-phase3.sh
./test-phase3.sh
```

### 8.2 実行方法

```bash
# サーバーを起動（別のターミナルで）
npm run dev

# テストを実行
./test-phase3.sh
```

---

## 9. トラブルシューティング

### よくある問題と解決方法

#### 問題1: "GEMINI_API_KEY is not configured"
**解決方法:**
```bash
# .env.localファイルを確認
cat .env.local | grep GEMINI_API_KEY

# APIキーが設定されているか確認
echo $GEMINI_API_KEY
```

#### 問題2: ストリーミングが動作しない
**解決方法:**
```bash
# ブラウザのキャッシュをクリア
# または
# シークレットモードで開く
```

#### 問題3: しおりが生成されない
**チェック項目:**
1. ブラウザのコンソールでエラーを確認
2. Network タブでAPIレスポンスを確認
3. サーバーのログを確認

#### 問題4: 認証エラー
**解決方法:**
```bash
# セッションをクリア
rm -rf .next
npm run dev
```

---

## 10. テストチェックリスト

### 必須テスト項目

#### 環境
- [ ] 環境変数が正しく設定されている
- [ ] 依存関係がインストールされている
- [ ] TypeScriptの型チェックが通る
- [ ] サーバーが起動する

#### API
- [ ] ヘルスチェックが成功する
- [ ] チャットAPIが応答する
- [ ] しおりが生成される
- [ ] ストリーミングが動作する
- [ ] エラーハンドリングが動作する

#### UI
- [ ] ログイン機能が動作する
- [ ] メッセージが送受信できる
- [ ] ストリーミング表示が動作する
- [ ] しおりが表示される
- [ ] エラー通知が表示される

#### 統合
- [ ] フルシナリオが完了する
- [ ] チャット履歴が保持される
- [ ] しおり更新が動作する
- [ ] パフォーマンスが許容範囲内

---

## 11. 次のステップ

Phase 3のテストが完了したら:

1. **Phase 4の準備**: 一時保存機能のテスト計画
2. **パフォーマンス最適化**: ボトルネックの特定
3. **ユーザーフィードバック**: 実際の使用感を確認

---

**テストガイド作成日**: 2025-10-07  
**対象バージョン**: Phase 3統合版
