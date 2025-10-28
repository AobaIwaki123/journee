# テストと検証手順

## 📋 目次

1. [概要](#概要)
2. [ローカル開発環境でのテスト](#ローカル開発環境でのテスト)
3. [Webhook検証ツール](#webhook検証ツール)
4. [メッセージ送受信テスト](#メッセージ送受信テスト)
5. [ユニットテスト](#ユニットテスト)
6. [統合テスト](#統合テスト)
7. [E2Eテスト](#e2eテスト)
8. [負荷テスト](#負荷テスト)
9. [本番環境での動作確認](#本番環境での動作確認)

---

## 概要

LINE botの品質を保証するため、複数のレベルでテストを実施します。

### テストの種類

| テスト種類 | 目的 | 実施タイミング |
|----------|------|--------------|
| **ユニットテスト** | 個別関数・クラスの動作確認 | 開発中・CI/CD |
| **統合テスト** | コンポーネント間の連携確認 | 開発中・CI/CD |
| **E2Eテスト** | エンドツーエンドの動作確認 | デプロイ前 |
| **手動テスト** | 実際のLINEアプリで動作確認 | デプロイ後 |
| **負荷テスト** | 大量リクエストへの耐性確認 | 本番リリース前 |

---

## ローカル開発環境でのテスト

### ngrokを使用したローカルテスト

LINEのWebhookはHTTPSが必須のため、ローカル開発ではngrokを使用します。

#### Step 1: ngrokのインストール

```bash
# macOS (Homebrew)
brew install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

#### Step 2: ngrokアカウント登録とAuthtoken設定

```bash
# https://dashboard.ngrok.com/signup でアカウント作成

# Authtokenを設定
ngrok config add-authtoken YOUR_AUTHTOKEN
```

#### Step 3: ローカルサーバーを起動

```bash
# Next.jsアプリを起動
npm run dev

# 別のターミナルでngrokを起動
ngrok http 3000
```

出力例:
```
ngrok                                                                                                      

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        Japan (jp)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

#### Step 4: Webhook URLを設定

LINE Developersコンソールで、Webhook URLを設定:
```
https://abc123.ngrok-free.app/api/line/webhook
```

#### Step 5: 動作確認

LINEアプリでbotにメッセージを送信し、ローカルのログを確認:

```bash
# ターミナルでログを確認
npm run dev

# ngrok Web Interface (http://127.0.0.1:4040) でリクエストを確認
```

---

## Webhook検証ツール

### LINE Webhook検証ツール

```typescript
// scripts/test-webhook.ts
import crypto from 'crypto';

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;
const WEBHOOK_URL = 'https://your-domain.com/api/line/webhook';

async function testWebhook() {
  const testEvent = {
    events: [
      {
        type: 'message',
        message: {
          type: 'text',
          id: '123456789',
          text: 'テストメッセージ',
        },
        timestamp: Date.now(),
        source: {
          type: 'user',
          userId: 'U1234567890abcdef1234567890abcdef',
        },
        replyToken: 'test-reply-token',
      },
    ],
    destination: 'U1234567890abcdef1234567890abcdef',
  };

  const body = JSON.stringify(testEvent);
  
  // 署名を生成
  const signature = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');

  // Webhookリクエストを送信
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Line-Signature': signature,
    },
    body,
  });

  console.log('Status:', response.status);
  console.log('Response:', await response.text());
}

testWebhook();
```

```bash
# 実行
npx ts-node scripts/test-webhook.ts
```

### curlでのテスト

```bash
# テストイベントを作成
cat > test-event.json << 'EOF'
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "id": "123456789",
        "text": "テストメッセージ"
      },
      "timestamp": 1234567890,
      "source": {
        "type": "user",
        "userId": "U1234567890abcdef1234567890abcdef"
      },
      "replyToken": "test-reply-token"
    }
  ],
  "destination": "U1234567890abcdef1234567890abcdef"
}
EOF

# 署名を生成
BODY=$(cat test-event.json)
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$LINE_CHANNEL_SECRET" -binary | base64)

# Webhookリクエストを送信
curl -X POST https://your-domain.com/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: $SIGNATURE" \
  -d "$BODY"
```

---

## メッセージ送受信テスト

### 基本的なメッセージ送受信

#### テストケース1: テキストメッセージ

```
ユーザー → bot: 「こんにちは」
期待される応答: ウェルカムメッセージまたはガイダンス
```

#### テストケース2: 旅行プラン作成

```
ユーザー → bot: 「京都に2泊3日で旅行したい」
期待される応答:
  1. 「考え中...」メッセージ
  2. 観光地のFlexメッセージ（複数）
  3. 食事のFlexメッセージ（複数）
  4. しおりサマリー
  5. 次のアクションを促すクイックリプライ
```

#### テストケース3: コマンド

```
ユーザー → bot: 「/help」
期待される応答: ヘルプメッセージ

ユーザー → bot: 「/reset」
期待される応答: 「会話をリセットしました」
```

### テストチェックリスト

- [ ] テキストメッセージの受信・応答
- [ ] Flex Messageの表示
- [ ] クイックリプライの動作
- [ ] ポストバックアクションの動作
- [ ] 画像送信の動作
- [ ] 位置情報送信の動作
- [ ] エラーメッセージの表示
- [ ] コマンドの動作（/help, /reset, /list）

---

## ユニットテスト

### ストリームパーサーのテスト

```typescript
// lib/line/__tests__/stream-parser.test.ts
import { LINEStreamParser } from '../stream-parser';
import { TouristSpotMessage } from '@/types/line-message';

describe('LINEStreamParser', () => {
  it('should extract tourist spot from complete input', async () => {
    const spots: TouristSpotMessage[] = [];
    
    const parser = new LINEStreamParser({
      onSpotExtracted: async (spot) => {
        spots.push(spot);
      },
    });

    const input = `
【観光地】清水寺
説明：京都を代表する歴史的な寺院。清水の舞台からの景色は絶景。
時間：10:00 - 12:00
予算：400円
住所：京都府京都市東山区清水1-294
タグ：寺院,世界遺産,観光名所

`;

    parser.addChunk(input);
    await parser.finalize();

    expect(spots).toHaveLength(1);
    expect(spots[0]).toMatchObject({
      type: 'tourist_spot',
      name: '清水寺',
      description: expect.stringContaining('京都を代表する'),
      budget: { amount: 400, currency: 'JPY' },
    });
  });

  it('should handle streaming chunks', async () => {
    const spots: TouristSpotMessage[] = [];
    
    const parser = new LINEStreamParser({
      onSpotExtracted: async (spot) => {
        spots.push(spot);
      },
    });

    // チャンクを分割して追加
    parser.addChunk('【観光地】清');
    parser.addChunk('水寺\n');
    parser.addChunk('説明：京都を');
    parser.addChunk('代表する寺院\n');
    parser.addChunk('時間：10:00 - 12:00\n');
    parser.addChunk('予算：400円\n\n');

    await parser.finalize();

    expect(spots).toHaveLength(1);
    expect(spots[0].name).toBe('清水寺');
  });

  it('should extract multiple spots', async () => {
    const spots: TouristSpotMessage[] = [];
    
    const parser = new LINEStreamParser({
      onSpotExtracted: async (spot) => {
        spots.push(spot);
      },
    });

    const input = `
【観光地】清水寺
説明：歴史的な寺院
予算：400円

【観光地】金閣寺
説明：金箔で覆われた寺院
予算：500円

`;

    parser.addChunk(input);
    await parser.finalize();

    expect(spots).toHaveLength(2);
    expect(spots[0].name).toBe('清水寺');
    expect(spots[1].name).toBe('金閣寺');
  });
});
```

### メッセージフォーマッターのテスト

```typescript
// lib/line/__tests__/message-formatters.test.ts
import { createTouristSpotFlexMessage } from '../message-formatters/tourist-spot-formatter';
import { TouristSpotMessage } from '@/types/line-message';

describe('Tourist Spot Formatter', () => {
  it('should create valid Flex Message', () => {
    const spot: TouristSpotMessage = {
      type: 'tourist_spot',
      name: '清水寺',
      description: '京都を代表する歴史的な寺院',
      time: '10:00 - 12:00',
      budget: { amount: 400, currency: 'JPY' },
      location: {
        lat: 34.994857,
        lng: 135.785007,
        address: '京都府京都市東山区清水1-294',
      },
      tags: ['寺院', '世界遺産'],
    };

    const flexMessage = createTouristSpotFlexMessage(spot);

    expect(flexMessage.type).toBe('flex');
    expect(flexMessage.altText).toContain('清水寺');
    expect(flexMessage.contents.type).toBe('bubble');
    
    // Bodyの検証
    const body = flexMessage.contents.body;
    expect(body.contents[0].text).toContain('清水寺');
  });
});
```

### 実行

```bash
# すべてのテストを実行
npm test

# 特定のテストを実行
npm test -- stream-parser.test.ts

# カバレッジレポート
npm test -- --coverage
```

---

## 統合テスト

### Webhookエンドポイントの統合テスト

```typescript
// __tests__/integration/webhook.test.ts
import { POST } from '@/app/api/line/webhook/route';
import crypto from 'crypto';

describe('LINE Webhook Integration', () => {
  it('should return 401 for invalid signature', async () => {
    const body = JSON.stringify({ events: [] });
    
    const request = new Request('http://localhost:3000/api/line/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Line-Signature': 'invalid-signature',
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 200 for valid signature', async () => {
    const body = JSON.stringify({
      events: [
        {
          type: 'message',
          message: { type: 'text', id: '123', text: 'test' },
          timestamp: Date.now(),
          source: { type: 'user', userId: 'U123' },
          replyToken: 'token123',
        },
      ],
    });

    const signature = crypto
      .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
      .update(body)
      .digest('base64');

    const request = new Request('http://localhost:3000/api/line/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Line-Signature': signature,
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

---

## E2Eテスト

### Playwrightを使用したE2Eテスト

```typescript
// e2e/line-bot.spec.ts
import { test, expect } from '@playwright/test';
import { lineClient } from '@/lib/line/client';

test.describe('LINE Bot E2E Tests', () => {
  const testUserId = 'U_TEST_USER_ID';

  test.beforeAll(async () => {
    // テスト用セッションをクリア
    await clearTestSession(testUserId);
  });

  test('should respond to text message', async () => {
    // Webhookエンドポイントにメッセージを送信
    const response = await sendTestMessage(testUserId, 'こんにちは');
    
    expect(response.status).toBe(200);
    
    // メッセージが送信されたか確認（モック）
    // 実際のテストではLINE APIのモックを使用
  });

  test('should create itinerary from user request', async () => {
    const response = await sendTestMessage(
      testUserId,
      '京都に2泊3日で旅行したい'
    );
    
    expect(response.status).toBe(200);
    
    // データベースにしおりが保存されたか確認
    const itinerary = await getLatestItinerary(testUserId);
    expect(itinerary).toBeDefined();
    expect(itinerary.destination).toContain('京都');
  });
});

async function sendTestMessage(userId: string, text: string) {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/line/webhook';
  const body = JSON.stringify({
    events: [
      {
        type: 'message',
        message: { type: 'text', id: Date.now().toString(), text },
        timestamp: Date.now(),
        source: { type: 'user', userId },
        replyToken: `test-token-${Date.now()}`,
      },
    ],
  });

  const signature = crypto
    .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64');

  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Line-Signature': signature,
    },
    body,
  });
}
```

```bash
# E2Eテストを実行
npx playwright test e2e/line-bot.spec.ts
```

---

## 負荷テスト

### k6を使用した負荷テスト

```javascript
// load-tests/webhook-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from 'k6/crypto';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 10 VUsまで増加
    { duration: '1m', target: 10 },   // 10 VUsを維持
    { duration: '30s', target: 50 },  // 50 VUsまで増加
    { duration: '1m', target: 50 },   // 50 VUsを維持
    { duration: '30s', target: 0 },   // 終了
  ],
};

const WEBHOOK_URL = __ENV.WEBHOOK_URL;
const CHANNEL_SECRET = __ENV.LINE_CHANNEL_SECRET;

export default function () {
  const body = JSON.stringify({
    events: [
      {
        type: 'message',
        message: {
          type: 'text',
          id: `${Date.now()}-${__VU}`,
          text: 'テストメッセージ',
        },
        timestamp: Date.now(),
        source: {
          type: 'user',
          userId: `U_LOAD_TEST_${__VU}`,
        },
        replyToken: `token-${Date.now()}-${__VU}`,
      },
    ],
  });

  const signature = crypto.hmac('sha256', CHANNEL_SECRET, body, 'base64');

  const response = http.post(WEBHOOK_URL, body, {
    headers: {
      'Content-Type': 'application/json',
      'X-Line-Signature': signature,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

```bash
# 負荷テストを実行
k6 run \
  -e WEBHOOK_URL=https://your-domain.com/api/line/webhook \
  -e LINE_CHANNEL_SECRET=your_secret \
  load-tests/webhook-load.js
```

---

## 本番環境での動作確認

### チェックリスト

#### 基本機能

- [ ] **友だち追加**
  - [ ] ウェルカムメッセージが表示される
  - [ ] クイックリプライが正しく表示される

- [ ] **メッセージ送受信**
  - [ ] テキストメッセージに応答する
  - [ ] 「考え中...」メッセージが表示される
  - [ ] Flex Messageが正しく表示される

- [ ] **しおり作成**
  - [ ] 観光地が段階的に送信される
  - [ ] 食事情報が送信される
  - [ ] しおりサマリーが送信される
  - [ ] データベースに保存される

- [ ] **コマンド**
  - [ ] `/help` が動作する
  - [ ] `/reset` が動作する
  - [ ] `/list` が動作する

#### エラーハンドリング

- [ ] 不正なメッセージへの対応
- [ ] AI処理エラー時のメッセージ
- [ ] タイムアウト時のメッセージ
- [ ] データベースエラー時の対応

#### パフォーマンス

- [ ] 応答時間が許容範囲内（< 3秒）
- [ ] メモリ使用量が適切
- [ ] CPU使用率が適切
- [ ] ログが正常に出力される

---

## テスト自動化

### GitHub Actionsでの自動テスト

```yaml
# .github/workflows/line-bot-test.yml
name: LINE Bot Tests

on:
  push:
    branches: [main, line-bot-integration]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## まとめ

### テストのベストプラクティス

1. **段階的なテスト**: ユニット → 統合 → E2E の順で実施
2. **自動化**: CI/CDパイプラインに組み込む
3. **継続的な監視**: 本番環境でのモニタリング
4. **ドキュメント化**: テストケースと期待結果を明記

### 次のステップ

テストが完了したら、LINE botは本番運用の準備が整いました！

- 本番環境へのデプロイ
- ユーザーへの公開
- フィードバック収集
- 継続的な改善

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [07_DEPLOYMENT.md](./07_DEPLOYMENT.md), [README.md](./README.md)
