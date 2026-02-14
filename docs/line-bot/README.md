# Journee LINE Bot 実装ガイド

## 📋 概要

このディレクトリには、JourneeアプリケーションをLINE botとして実装するための包括的なガイドが含まれています。

Journeeは現在、Web版のチャットインターフェースでAIと対話しながら旅行のしおりを作成するアプリケーションですが、LINE botとして実装することで、より多くのユーザーにリーチし、日常的に使われるLINEアプリ上で旅行計画を立てられるようになります。

## 🎯 LINE bot化の主な利点

1. **ユーザーアクセスの向上**: LINEアプリから直接利用可能
2. **モバイルファースト**: スマートフォンでの使い勝手が最適化
3. **通知機能**: しおり完成時やリマインダーをプッシュ通知
4. **友達と共有**: LINE上で簡単にしおりを共有可能

## 📚 ドキュメント構成

### 1. [概要と考慮事項](./01_OVERVIEW.md)
LINE bot化における技術的課題、アーキテクチャの違い、考慮すべき制約事項について説明します。

**主なトピック:**
- Web版とLINE bot版の違い
- ストリーミング処理から段階的送信への変更
- ユーザー管理とセッション管理
- データ永続化戦略

### 2. [LINE Developers 登録と設定](./02_REGISTRATION.md)
LINE Developersコンソールでのbot登録手順と、必要な設定について詳しく解説します。

**主なトピック:**
- LINE Developersアカウント作成
- Messaging APIチャネル作成
- Webhook URL設定
- アクセストークン取得
- bot設定（応答モード、グループ参加など）

### 3. [アーキテクチャ設計](./03_ARCHITECTURE.md)
LINE bot版のシステムアーキテクチャ、コンポーネント構成、データフローについて説明します。

**主なトピック:**
- 全体アーキテクチャ図
- Webhook処理フロー
- 状態管理とセッション管理
- データベース設計
- 既存コードの再利用戦略

### 4. [メッセージフォーマット設計](./04_MESSAGE_FORMAT.md)
LINE上で送信するメッセージの形式、テンプレート、Flex Messageの設計について説明します。

**主なトピック:**
- テキストメッセージフォーマット
- Flex Messageによるリッチな表示
- 観光地、食事、歓楽街などのカテゴリ別テンプレート
- アクションボタンとクイックリプライ
- 画像とマップの表示

### 5. [バックエンドAPI実装](./05_BACKEND_API.md)
LINE bot専用のバックエンドAPIの実装方法、既存AIロジックの活用について説明します。

**主なトピック:**
- Webhook APIエンドポイント実装
- メッセージ受信処理
- AI応答生成（段階的送信対応）
- しおり生成・保存API
- エラーハンドリング

### 6. [ストリーミングメッセージ解析](./06_STREAMING_PARSER.md)
AIのストリーミング応答を解析し、LINEメッセージに変換する処理について説明します。

**主なトピック:**
- ストリーミング応答のバッファリング
- スポット情報の抽出パターン
- カテゴリ別のメッセージ生成
- 送信タイミング制御
- エラーリカバリー

### 7. [デプロイメント](./07_DEPLOYMENT.md)
LINE botのデプロイ手順、環境変数設定、本番運用について説明します。

**主なトピック:**
- Google Cloud Run / Kubernetesへのデプロイ
- 環境変数設定（LINE_CHANNEL_SECRET, LINE_ACCESS_TOKENなど）
- Webhook URLの設定
- HTTPS対応
- ログ監視とエラー追跡

### 8. [テストと検証](./08_TESTING.md)
LINE botの動作確認方法、テストケース、デバッグ手順について説明します。

**主なトピック:**
- ローカル開発環境でのテスト（ngrok使用）
- Webhook検証ツール
- メッセージ送受信テスト
- E2Eテストシナリオ
- 本番環境での動作確認

## 🚀 クイックスタート

LINE bot実装を始めるには、以下の順序でドキュメントを読み進めることをおすすめします：

1. **初めての方**: [01_OVERVIEW.md](./01_OVERVIEW.md) → [02_REGISTRATION.md](./02_REGISTRATION.md)
2. **設計を理解したい方**: [03_ARCHITECTURE.md](./03_ARCHITECTURE.md) → [04_MESSAGE_FORMAT.md](./04_MESSAGE_FORMAT.md)
3. **実装を始める方**: [05_BACKEND_API.md](./05_BACKEND_API.md) → [06_STREAMING_PARSER.md](./06_STREAMING_PARSER.md)
4. **デプロイする方**: [07_DEPLOYMENT.md](./07_DEPLOYMENT.md) → [08_TESTING.md](./08_TESTING.md)

## 🔑 前提条件

LINE bot実装を始める前に、以下を準備してください：

- [ ] LINE Developersアカウント
- [ ] 公開可能なWebサーバー（HTTPS必須）
- [ ] Supabaseデータベース設定済み
- [ ] Google Gemini / Anthropic Claude APIキー
- [ ] Node.js 18+の開発環境

## 📦 必要な追加パッケージ

```json
{
  "@line/bot-sdk": "^8.0.0",
  "axios": "^1.6.0"
}
```

## 🔗 関連リソース

- [LINE Developers公式ドキュメント](https://developers.line.biz/ja/docs/)
- [Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [LINE Bot Designer](https://designers.line.biz/ja/)

## 📝 用語集

| 用語 | 説明 |
|------|------|
| Messaging API | LINEのbot開発用API |
| Webhook | LINEからメッセージが送られてくるエンドポイント |
| Channel Access Token | botがAPIを呼び出すための認証トークン |
| Channel Secret | Webhookリクエストの署名検証用シークレット |
| Flex Message | LINEのリッチメッセージフォーマット |
| Quick Reply | メッセージ下部に表示される選択肢ボタン |
| Push API | botから能動的にメッセージを送信するAPI |
| Reply API | ユーザーメッセージへの返信API |

## 🤝 貢献

LINE bot実装について改善提案やフィードバックがあれば、Issueまたはプルリクエストを作成してください。

## 📄 ライセンス

このドキュメントは、Journeeプロジェクトのライセンスに従います。

---

**最終更新**: 2025-10-10  
**バージョン**: 1.0.0  
**執筆者**: Journee Development Team
