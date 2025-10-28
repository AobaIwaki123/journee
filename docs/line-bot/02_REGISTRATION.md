# LINE Developers 登録と設定手順

## 📋 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [LINE Developersアカウント作成](#line-developersアカウント作成)
4. [Providerの作成](#providerの作成)
5. [Messaging APIチャネルの作成](#messaging-apiチャネルの作成)
6. [チャネル基本設定](#チャネル基本設定)
7. [Webhook URL設定](#webhook-url設定)
8. [アクセストークン取得](#アクセストークン取得)
9. [Bot設定の調整](#bot設定の調整)
10. [動作確認](#動作確認)

---

## 概要

Journee LINE botを開発・運用するには、LINE Developersコンソールでの設定が必要です。このドキュメントでは、初めてLINE botを作成する開発者向けに、手順を詳しく説明します。

**所要時間**: 約30-45分

---

## 前提条件

開始する前に、以下を準備してください：

- [ ] **LINEアカウント**: 個人のLINEアカウント（必須）
- [ ] **メールアドレス**: LINE Developers登録用
- [ ] **公開Webサーバー**: WebhookエンドポイントをホストするHTTPS対応サーバー
  - ローカル開発の場合は [ngrok](https://ngrok.com/) 等のトンネリングサービス
  - 本番環境の場合は Google Cloud Run / Kubernetes

---

## LINE Developersアカウント作成

### Step 1: LINE Developersにアクセス

1. ブラウザで [LINE Developers](https://developers.line.biz/) にアクセス
2. 右上の「ログイン」ボタンをクリック

![LINE Developers トップページ](https://developers.line.biz/assets/img/top-hero.png)

### Step 2: LINEアカウントでログイン

1. 個人のLINEアカウントでログイン
   - QRコードをスキャン、または
   - メールアドレスとパスワードを入力
2. 初回ログイン時は開発者情報の登録が求められます

### Step 3: 開発者情報の登録

以下の情報を入力：

| 項目 | 内容 | 例 |
|------|------|-----|
| **名前** | 開発者またはチーム名 | Journee Development Team |
| **メールアドレス** | 連絡先メール | dev@journee.example.com |

「登録」ボタンをクリックして完了

---

## Providerの作成

Providerは、複数のチャネル（bot）を管理するための組織単位です。

### Step 1: Providerを新規作成

1. LINE Developersコンソールにログイン
2. 「Create a new provider」ボタンをクリック

### Step 2: Provider情報を入力

| 項目 | 内容 | 例 |
|------|------|-----|
| **Provider name** | Provider名（変更不可なので慎重に） | Journee |

**注意**: Provider名は後から変更できません！

3. 「Create」ボタンをクリック

---

## Messaging APIチャネルの作成

### Step 1: チャネルタイプを選択

1. 作成したProviderの画面で「Create a new channel」をクリック
2. チャネルタイプで「**Messaging API**」を選択

### Step 2: チャネル情報を入力

| 項目 | 必須 | 内容 | 例 |
|------|------|------|-----|
| **Channel name** | ✅ | botの名前（後で変更可能） | Journee Bot |
| **Channel description** | ✅ | botの説明（後で変更可能） | AIとともに旅のしおりを作成するbot |
| **Category** | ✅ | カテゴリ | Travel / Tourism |
| **Subcategory** | ✅ | サブカテゴリ | Travel planning |
| **Email address** | ✅ | 連絡先メール | dev@journee.example.com |
| **Privacy policy URL** | ❌ | プライバシーポリシーURL | https://journee.example.com/privacy |
| **Terms of use URL** | ❌ | 利用規約URL | https://journee.example.com/terms |

### Step 3: アイコン画像のアップロード（オプション）

- **推奨サイズ**: 1000x1000px 以上
- **形式**: PNG, JPG
- **容量**: 1MB以下

**Journee bot用アイコンのヒント**:
- 旅行やマップをイメージさせるデザイン
- シンプルで認識しやすいもの
- ブランドカラー（青〜紫のグラデーション）を使用

### Step 4: 規約に同意して作成

1. LINE公式アカウント利用規約に同意
2. LINE公式アカウントAPI利用規約に同意
3. 「Create」ボタンをクリック

---

## チャネル基本設定

### チャネル作成完了後の画面

チャネルが作成されると、以下のタブが表示されます：

- **Basic settings**: 基本設定
- **Messaging API**: Webhook、応答設定
- **LINE Official Account features**: 公式アカウント機能
- **Roles**: 権限管理

### Basic settings タブで確認すべき情報

| 項目 | 説明 | 用途 |
|------|------|------|
| **Channel ID** | チャネルの一意識別子 | 統計分析などで使用 |
| **Channel secret** | 署名検証用のシークレット | **環境変数 `LINE_CHANNEL_SECRET` に設定** |
| **Your user ID** | 開発者のLINE User ID | テスト時に使用 |

**重要**: `Channel secret` は外部に漏らさないよう厳重に管理してください！

---

## Webhook URL設定

### Step 1: Messaging API タブを開く

1. チャネル管理画面で「Messaging API」タブをクリック

### Step 2: Webhook URLを設定

| 項目 | 設定値 | 説明 |
|------|--------|------|
| **Webhook URL** | `https://your-domain.com/api/line/webhook` | メッセージを受信するエンドポイント |
| **Use webhook** | ON | Webhookを有効化 |
| **Webhook redelivery** | OFF（初期） | 失敗時の再送（デバッグ時はOFF推奨） |

#### ローカル開発環境の場合（ngrok使用）

```bash
# ngrokでローカルサーバーを公開
ngrok http 3000

# 出力例
# Forwarding https://abc123.ngrok.io -> http://localhost:3000

# Webhook URLに設定
# https://abc123.ngrok.io/api/line/webhook
```

#### 本番環境の場合（Google Cloud Run）

```bash
# デプロイ後のURL例
# https://journee-bot-xyz123.run.app

# Webhook URLに設定
# https://journee-bot-xyz123.run.app/api/line/webhook
```

### Step 3: Webhook URLを検証

1. 「Verify」ボタンをクリック
2. 成功すると「Success」と表示される

**エラーが出る場合**:
- サーバーが起動しているか確認
- HTTPS対応しているか確認
- `/api/line/webhook` エンドポイントが実装されているか確認

---

## アクセストークン取得

### Channel Access Token（チャネルアクセストークン）

このトークンを使用してLINE Messaging APIを呼び出します。

### Step 1: Messaging API タブでトークンを発行

1. 「Messaging API」タブを開く
2. 「Channel access token」セクションを見つける
3. 「Issue」ボタンをクリック

### Step 2: トークンをコピー

- 発行されたトークンをコピー
- **環境変数 `LINE_CHANNEL_ACCESS_TOKEN` に設定**

**重要**: このトークンは再表示できません！安全な場所に保存してください。

### Step 3: 環境変数に設定

```bash
# .env.local
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
```

**セキュリティ注意**:
- `.env.local` は必ず `.gitignore` に追加
- 本番環境では環境変数をセキュアに管理（Google Secret Manager等）

---

## Bot設定の調整

### 応答設定

LINE公式アカウントには「Webhook」と「応答メッセージ」の2つの応答方法があります。

#### Step 1: LINE Official Account features タブを開く

#### Step 2: 応答モードを設定

| 設定項目 | 推奨設定 | 理由 |
|---------|---------|------|
| **応答メッセージ** | OFF | Webhookで独自応答を実装するため |
| **Greeting message** | OFF | カスタムメッセージをWebhookで送信 |
| **AI応答メッセージ** | OFF | Gemini/Claudeを使用するため |
| **Webhook** | ON | 必須 |

#### Step 3: 友だち追加時の設定

| 設定項目 | 推奨設定 |
|---------|---------|
| **あいさつメッセージ** | Webhook で実装 |
| **自動応答メッセージ** | OFF |

### プライバシー設定

| 設定項目 | 推奨設定 | 説明 |
|---------|---------|------|
| **Allow bot to join group chats** | ON/OFF | グループチャット参加を許可するか |
| **Use webhooks** | ON | 必須 |
| **Scan QR code** | ON | QRコードスキャンを許可 |

---

## 動作確認

### Step 1: botを友だち追加

1. LINE Developersコンソールの「Messaging API」タブを開く
2. QRコードをスキャン、または
3. Bot basic ID（@で始まるID）で検索

### Step 2: テストメッセージを送信

友だち追加後、以下のテストメッセージを送ってみましょう：

```
こんにちは
```

#### 期待される動作

**Phase 1実装時（オウム返しbot）**:
```
あなた: こんにちは
Bot: こんにちは
```

**完全実装後**:
```
あなた: こんにちは
Bot: こんにちは！Journee botです🗺️
    旅行の計画をお手伝いします。
    どこへ行きたいですか？
```

### Step 3: Webhook ログの確認

LINE Developersコンソールで、Webhookリクエストのログを確認できます：

1. 「Messaging API」タブを開く
2. 「Webhook URL」セクションの「View logs」をクリック

**確認すべきポイント**:
- ステータスコード: `200 OK`
- レスポンスタイム: 30秒以内

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. Webhook URLの検証が失敗する

**症状**: Verifyボタンを押しても「Failed」になる

**原因と解決策**:
- [ ] サーバーが起動していない → サーバーを起動
- [ ] HTTPSでない → ngrokまたはHTTPS対応サーバーを使用
- [ ] エンドポイントが実装されていない → `/api/line/webhook` を実装
- [ ] 署名検証で失敗 → `Channel secret` が正しいか確認

#### 2. メッセージが送信できない

**症状**: botがメッセージに応答しない

**原因と解決策**:
- [ ] 応答メッセージがONになっている → OFFに変更
- [ ] Webhookがエラーを返している → ログを確認
- [ ] Channel Access Tokenが間違っている → 環境変数を確認
- [ ] API制限に達した → レート制限を確認

#### 3. トークンやシークレットを紛失した

**Channel secret**:
- 「Basic settings」タブで確認可能（再生成も可能）

**Channel access token**:
- 「Issue」ボタンで再発行可能（古いトークンは無効化される）

---

## チェックリスト

設定完了前に以下を確認してください：

- [ ] LINE Developersアカウント作成完了
- [ ] Provider作成完了
- [ ] Messaging APIチャネル作成完了
- [ ] Channel secret を取得して環境変数に設定
- [ ] Channel access token を発行して環境変数に設定
- [ ] Webhook URL を設定して検証成功
- [ ] 応答メッセージをOFFに設定
- [ ] WebhookをONに設定
- [ ] botを友だち追加してテスト送信成功

---

## 次のステップ

設定が完了したら、次のドキュメントに進んでください：

- **アーキテクチャを理解する**: [03_ARCHITECTURE.md](./03_ARCHITECTURE.md)
- **実装を始める**: [05_BACKEND_API.md](./05_BACKEND_API.md)

---

## 参考リンク

- [LINE Developers公式ドキュメント](https://developers.line.biz/ja/docs/)
- [Messaging APIリファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [Messaging APIの始め方](https://developers.line.biz/ja/docs/messaging-api/getting-started/)
- [ngrok公式サイト](https://ngrok.com/)

---

**最終更新**: 2025-10-10  
**関連ドキュメント**: [01_OVERVIEW.md](./01_OVERVIEW.md), [03_ARCHITECTURE.md](./03_ARCHITECTURE.md)
