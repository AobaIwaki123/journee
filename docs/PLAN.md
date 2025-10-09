# Journee 実装計画

このドキュメントは、Journeeプロジェクトの今後の実装計画と各フェーズの詳細を記載しています。

**最終更新**: 2025-10-09  
**現在のバージョン**: 0.9.0  
**現在のフェーズ**: Phase 10 準備中

---

## ユーザー定義タスク

適宜詳細化してください

- 閲覧ページでコメントする際にログインすることで、Googleのユーザー名を自動入力できる様にする

## 📊 現在の状況

### 完了済み機能
- ✅ Phase 1-8: 基本機能、認証、AI統合、データベース統合
- ✅ しおり作成・編集・共有機能
- ✅ PDF出力機能
- ✅ モバイル対応・PWA
- ✅ Supabaseデータベース統合
- ✅ Phase 10.2: OGP画像の動的生成機能

### 既知の問題
- ✅ ~~閲覧ページ（`/share/[slug]`）でPDF機能が無効化されている~~ → **Phase 10.1で修正完了**
- ⚠️ 共有URLのOGP画像が表示されない
- ⚠️ パフォーマンス指標が目標未達（初期ロード、Lighthouse）


## 📋 実装フェーズ概要

### Phase 10: バグ修正とUX改善（優先度: 高）
**目標**: 既知のバグを修正し、共有機能を完全に機能させる  
**期間**: 1週間  
**ステータス**: 📝 計画中

#### Phase 10.1: 閲覧ページのPDF機能修正 ✅
**優先度**: ⭐⭐⭐ 高  
**完了日**: 2025-10-09

##### 問題
- 閲覧ページ（`/share/[slug]/page.tsx`）でPDF出力ボタンが無効化されている
- PDFプレビュー機能が動作しない

##### 実装タスク

1. **PDF出力ボタンの有効化**
   - [x] `PublicItineraryView.tsx`を調査（PDF機能の実装状況確認）
   - [x] PDFExportButtonを閲覧ページで使用可能にする
   - [x] 公開しおりデータをPDF生成関数に渡す処理を実装
   
2. **PDFプレビュー機能の修正**
   - [x] PDFPreviewModalを閲覧ページで利用可能にする
   - [x] プレビュー表示のレイアウト調整
   - [x] 認証不要でもPDF生成できるよう修正
   
3. **テスト**
   - [x] E2Eテスト: 閲覧ページからPDFダウンロード
   - [ ] 手動テスト: 各ブラウザでの動作確認（推奨）

##### 関連ファイル
```
- components/itinerary/PublicItineraryView.tsx
- components/itinerary/PDFExportButton.tsx
- components/itinerary/PDFPreviewModal.tsx
- app/share/[slug]/page.tsx
- lib/utils/pdf-generator.ts
```

---

#### Phase 10.2: OGP画像の実装 ✅ 完了
**優先度**: ⭐⭐⭐ 高  
**完了日**: 2025-10-09

##### 問題
- SNSでURLを共有した際のプレビュー画像が表示されない
- Open Graph Protocolメタタグが不足

##### 実装タスク

1. **OGP画像の動的生成** ✅
   - [x] `/app/api/og/route.tsx` を作成（Next.js ImageResponse使用）
   - [x] しおりのタイトル、行き先、日数を含む画像を生成
   - [x] 美しいデザインテンプレート作成
   
2. **メタタグの設定** ✅
   - [x] `/app/share/[slug]/page.tsx` にmetadata設定を追加
   - [x] 動的OGP画像URLの生成（`/api/og?slug=${params.slug}`）
   - [x] OpenGraphとTwitter Cardのメタデータ設定
   
3. **環境設定** ✅
   - [x] `.env.example` に `NEXT_PUBLIC_BASE_URL` を追加
   - [x] `app/layout.tsx` にデフォルトOGP設定を追加
   - [x] `public/images/README.md` にOGP画像のドキュメント追加
   
4. **テスト** ⚠️ 手動テスト推奨
   - [ ] Twitter Card Validator でテスト
   - [ ] Facebook Sharing Debugger でテスト
   - [ ] LINE、Slackでの表示確認
   - 📖 詳細なテスト方法: [OGP_TESTING.md](./OGP_TESTING.md)

##### 実装内容
- `/app/api/og/route.tsx`: Edge Runtime対応のOGP画像生成API
  - しおりのタイトル、目的地、日数を美しいグラデーション背景に配置
  - 1200x630pxの標準サイズで生成
- `/app/share/[slug]/page.tsx`: 動的メタデータ生成
  - OpenGraphとTwitter Cardの完全対応
  - Base URLの自動検出（本番・開発環境対応）
- `/app/layout.tsx`: デフォルトOGP設定
  - サイト全体のOpenGraph設定
  - metadataBaseの設定

##### 関連ファイル
```
- app/api/og/route.tsx（新規作成）✅
- app/share/[slug]/page.tsx（metadata更新）✅
- app/layout.tsx（デフォルトOGP設定追加）✅
- .env.example（NEXT_PUBLIC_BASE_URL追加）✅
- public/images/README.md（ドキュメント更新）✅
```

##### 技術仕様
- Next.js Image Response API（組み込み、追加パッケージ不要）
- OGP画像サイズ: 1200x630px
- フォーマット: PNG
- Edge Runtime対応

---

### Phase 11: コメント機能（新機能）
**目標**: 公開しおりへのコメント機能を実装  
**期間**: 2週間  
**ステータス**: 📝 計画中

#### Phase 11.1: データベーススキーマ設計
**優先度**: ⭐⭐ 中

##### 実装タスク

1. **commentsテーブル作成**
   - [ ] スキーマ定義を `lib/db/schema.sql` に追加
   ```sql
   CREATE TABLE IF NOT EXISTS comments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = 匿名
     author_name VARCHAR(100), -- 匿名時の表示名
     content TEXT NOT NULL,
     is_anonymous BOOLEAN DEFAULT FALSE,
     is_reported BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   CREATE INDEX idx_comments_itinerary_id ON comments(itinerary_id, created_at DESC);
   CREATE INDEX idx_comments_user_id ON comments(user_id) WHERE user_id IS NOT NULL;
   ```
   
2. **RLS（Row Level Security）設定**
   - [ ] 全員がコメント閲覧可能（公開しおりの場合）
   - [ ] 認証ユーザー・匿名ユーザーともに投稿可能
   - [ ] 自分のコメントのみ削除可能
   
3. **マイグレーション実行**
   - [ ] Supabaseダッシュボードでスキーマ実行
   - [ ] 本番環境への適用

##### 関連ファイル
```
- lib/db/schema.sql（更新）
- lib/db/comment-repository.ts（新規作成）
```

---

#### Phase 11.2: APIエンドポイント実装
**優先度**: ⭐⭐ 中

##### 実装タスク

1. **コメント取得API**
   - [ ] `GET /api/itinerary/[id]/comments` を作成
   - [ ] ページネーション対応（limit, offset）
   - [ ] 新着順・古い順のソート対応
   
2. **コメント投稿API**
   - [ ] `POST /api/itinerary/[id]/comments` を作成
   - [ ] 匿名投稿の対応（`is_anonymous` フラグ）
   - [ ] バリデーション（文字数制限、スパム対策）
   - [ ] レート制限（1分に3回まで）
   
3. **コメント削除API**
   - [ ] `DELETE /api/itinerary/[id]/comments/[commentId]` を作成
   - [ ] 自分のコメントのみ削除可能
   
4. **コメント報告API（オプション）**
   - [ ] `POST /api/itinerary/[id]/comments/[commentId]/report` を作成
   - [ ] スパム・不適切なコメントの報告機能

##### 関連ファイル
```
- app/api/itinerary/[id]/comments/route.ts（新規作成）
- app/api/itinerary/[id]/comments/[commentId]/route.ts（新規作成）
- lib/db/comment-repository.ts（新規作成）
```

##### APIレスポンス例
```typescript
// GET /api/itinerary/[id]/comments
{
  "data": [
    {
      "id": "uuid",
      "author_name": "匿名ユーザー",
      "content": "素敵なプランですね！",
      "is_anonymous": true,
      "created_at": "2025-10-09T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0
  }
}
```

---

#### Phase 11.3: UIコンポーネント実装
**優先度**: ⭐⭐ 中

##### 実装タスク

1. **コメント表示コンポーネント**
   - [ ] `CommentList.tsx` を作成（コメント一覧）
   - [ ] `CommentItem.tsx` を作成（個別コメント）
   - [ ] 匿名/認証ユーザーの表示分け
   - [ ] 自分のコメントに削除ボタン表示
   
2. **コメント投稿フォーム**
   - [ ] `CommentForm.tsx` を作成
   - [ ] テキストエリア（最大500文字）
   - [ ] 「匿名で投稿」チェックボックス
   - [ ] 投稿ボタン（送信中は無効化）
   
3. **閲覧ページへの統合**
   - [ ] `/app/share/[slug]/page.tsx` にコメントセクション追加
   - [ ] コメント数の表示
   - [ ] リアルタイム更新（オプション：Supabase Realtime）

##### 関連ファイル
```
- components/comments/CommentList.tsx（新規作成）
- components/comments/CommentItem.tsx（新規作成）
- components/comments/CommentForm.tsx（新規作成）
- app/share/[slug]/page.tsx（更新）
```

##### UIデザインイメージ
```
┌─────────────────────────────────────┐
│ 🗨️ コメント (15件)                  │
├─────────────────────────────────────┤
│ [匿名ユーザー] 2時間前               │
│ 素敵なプランですね！                 │
│                            [報告]    │
├─────────────────────────────────────┤
│ [田中太郎] 1日前                     │
│ 参考にさせていただきます！           │
│                      [削除] [報告]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ コメントを入力...                │ │
│ └─────────────────────────────────┘ │
│ ☐ 匿名で投稿              [投稿]    │
└─────────────────────────────────────┘
```

---

### Phase 12: フィードバック機能
**目標**: ユーザーフィードバックをGitHub Issueとして自動登録  
**期間**: 1週間  
**ステータス**: 📝 計画中

#### Phase 12.1: GitHub API統合
**優先度**: ⭐ 低

##### 実装タスク

1. **GitHub API設定**
   - [ ] GitHub Personal Access Token取得
   - [ ] 環境変数に`GITHUB_TOKEN`を追加
   - [ ] リポジトリ情報の設定（owner, repo）
   
2. **Issue作成API実装**
   - [ ] `POST /api/feedback` を作成
   - [ ] GitHub REST APIでIssue作成
   - [ ] カテゴリごとのラベル自動付与
     - `bug`: バグ報告
     - `enhancement`: 機能要望
     - `question`: その他
   
3. **テンプレート作成**
   - [ ] Issue本文のテンプレート化
   - [ ] ユーザー情報、ブラウザ情報の自動付与

##### 関連ファイル
```
- app/api/feedback/route.ts（新規作成）
- lib/utils/github-client.ts（新規作成）
```

##### GitHub Issue テンプレート例
```markdown
## フィードバック

**カテゴリ**: バグ報告
**送信者**: 匿名ユーザー（またはユーザー名）
**日時**: 2025-10-09 10:00:00

### 内容
[ユーザーが入力した内容]

### 環境情報
- ブラウザ: Chrome 120.0.0
- OS: macOS 14.0
- デバイス: Desktop
```

---

#### Phase 12.2: フィードバックフォーム実装
**優先度**: ⭐ 低

##### 実装タスク

1. **フィードバックモーダル作成**
   - [ ] `FeedbackModal.tsx` を作成
   - [ ] カテゴリ選択（バグ/機能要望/その他）
   - [ ] 詳細入力（テキストエリア）
   - [ ] スクリーンショット添付（オプション）
   
2. **フィードバックボタン追加**
   - [ ] ヘッダーに「フィードバック」ボタン追加
   - [ ] フッターに「問題を報告」リンク追加
   
3. **送信完了フィードバック**
   - [ ] 送信成功時のトースト通知
   - [ ] GitHub Issue URLの表示（オプション）

##### 関連ファイル
```
- components/feedback/FeedbackModal.tsx（新規作成）
- components/layout/Header.tsx（更新）
```

---

### Phase 13: パフォーマンス最適化
**目標**: 初期ロード時間短縮、Lighthouseスコア向上  
**期間**: 2週間  
**ステータス**: 📝 計画中

#### Phase 13.1: 初期ロード時間の短縮
**優先度**: ⭐⭐ 中

##### 現在の指標
- 初期ロード時間: 2.5秒（目標: < 2秒）
- TTI: 3.2秒（目標: < 3秒）

##### 実装タスク

1. **コード分割の最適化**
   - [ ] 動的インポートの徹底
   ```typescript
   const PDFPreviewModal = dynamic(() => import('@/components/itinerary/PDFPreviewModal'));
   const MapView = dynamic(() => import('@/components/itinerary/MapView'));
   ```
   - [ ] ルートベースのコード分割
   - [ ] 初回表示に不要なコンポーネントの遅延ロード
   
2. **画像最適化**
   - [ ] Next.js Image コンポーネントの徹底
   - [ ] WebP形式の使用
   - [ ] 適切なサイズ指定
   - [ ] 遅延ロード（loading="lazy"）
   
3. **フォント最適化**
   - [ ] フォントサブセット化
   - [ ] font-display: swap の設定
   - [ ] Google Fontsの最適化

##### 関連ファイル
```
- app/layout.tsx（フォント最適化）
- next.config.js（画像最適化設定）
- 各コンポーネント（動的インポート）
```

---

#### Phase 13.2: Lighthouseスコア改善
**優先度**: ⭐⭐ 中

##### 現在の指標
- モバイル: 85（目標: > 90）
- デスクトップ: 92（目標: > 95）

##### 実装タスク

1. **アクセシビリティ対応**
   - [ ] ARIA属性の追加
   - [ ] キーボードナビゲーション対応
   - [ ] カラーコントラスト比の改善
   - [ ] フォーカス管理の最適化
   
2. **SEO最適化**
   - [ ] メタタグの充実
   - [ ] 構造化データ（JSON-LD）の追加
   - [ ] セマンティックHTMLの徹底
   - [ ] sitemap.xml の生成
   
3. **ベストプラクティス**
   - [ ] HTTPSの徹底
   - [ ] 非推奨APIの削除
   - [ ] コンソールエラーの解消
   - [ ] セキュリティヘッダーの設定

##### 関連ファイル
```
- app/layout.tsx（メタタグ）
- middleware.ts（セキュリティヘッダー）
- app/sitemap.ts（新規作成）
- app/robots.ts（新規作成）
```

---

### Phase 14: テストカバレッジ向上
**目標**: テストカバレッジ80%以上  
**期間**: 2週間  
**ステータス**: 📝 計画中

#### 現在のカバレッジ
- ユニットテスト: 60%（目標: 80%）
- 統合テスト: 40%（目標: 70%）
- E2Eテスト: 30%（目標: 60%）

#### Phase 14.1: ユニットテスト追加
**優先度**: ⭐⭐ 中

##### 実装タスク

1. **ユーティリティ関数のテスト**
   - [ ] `lib/utils/` 配下の関数
   - [ ] `lib/ai/prompts.ts` のパース関数
   - [ ] `lib/requirements/extractors.ts` の抽出ロジック
   
2. **Zustand ストアのテスト**
   - [ ] `lib/store/` 配下のSlice
   - [ ] 状態更新ロジック
   - [ ] 副作用の検証
   
3. **データベースリポジトリのテスト**
   - [ ] `lib/db/itinerary-repository.ts`
   - [ ] CRUD操作の検証
   - [ ] エラーハンドリングの検証

##### 関連ファイル
```
- lib/utils/__tests__/
- lib/store/__tests__/
- lib/db/__tests__/
```

---

#### Phase 14.2: E2Eテスト追加
**優先度**: ⭐⭐ 中

##### 実装タスク

1. **認証フローのテスト**
   - [ ] ログイン・ログアウト
   - [ ] 保護されたページへのアクセス
   - [ ] セッション維持の確認
   
2. **しおり作成フローのテスト**
   - [ ] 情報収集フェーズ
   - [ ] 骨組み作成フェーズ
   - [ ] 詳細化フェーズ
   - [ ] 完成までの一連の流れ
   
3. **編集機能のテスト**
   - [ ] インライン編集
   - [ ] Undo/Redo
   - [ ] ドラッグ&ドロップ
   - [ ] スポット追加・削除
   
4. **共有機能のテスト**
   - [ ] 公開URL発行
   - [ ] 閲覧ページへのアクセス
   - [ ] PDF出力
   - [ ] コメント投稿（Phase 11後）

##### 関連ファイル
```
- e2e/auth.spec.ts（新規作成）
- e2e/itinerary-creation.spec.ts（新規作成）
- e2e/editing.spec.ts（新規作成）
- e2e/sharing.spec.ts（新規作成）
```

---

## 🎯 優先順位マトリクス

| Phase | 機能 | 優先度 | 影響度 | 難易度 | 期間 |
|-------|------|--------|--------|--------|------|
| 10.1 | 閲覧ページPDF修正 | ⭐⭐⭐ 高 | 高 | 低 | 2日 |
| 10.2 | OGP画像実装 | ⭐⭐⭐ 高 | 高 | 中 | 3日 |
| 11 | コメント機能 | ⭐⭐ 中 | 中 | 中 | 2週間 |
| 12 | フィードバック機能 | ⭐ 低 | 低 | 低 | 1週間 |
| 13 | パフォーマンス最適化 | ⭐⭐ 中 | 高 | 中 | 2週間 |
| 14 | テスト追加 | ⭐⭐ 中 | 中 | 中 | 2週間 |

---

## 📅 実装スケジュール（推奨）

### 第1週: Phase 10（バグ修正）
- Day 1-2: 閲覧ページPDF機能修正
- Day 3-5: OGP画像実装
- Day 6-7: テスト・デバッグ

### 第2-3週: Phase 11（コメント機能）
- Week 2 前半: データベース設計・API実装
- Week 2 後半: UI実装
- Week 3: テスト・デバッグ・リリース

### 第4-5週: Phase 13（パフォーマンス最適化）
- Week 4: 初期ロード時間短縮
- Week 5: Lighthouseスコア改善

### 第6-7週: Phase 14（テスト追加）
- Week 6: ユニットテスト追加
- Week 7: E2Eテスト追加

### 第8週: Phase 12（フィードバック機能）※優先度低
- 余裕があれば実装

---

## 🔗 関連ドキュメント

- [リリース履歴（RELEASE.md）](./RELEASE.md)
- [バグ・改善点（BUG.md）](./BUG.md)
- [API仕様（API.md）](./API.md)
- [コーディングガイドライン（GUIDELINE.md）](./GUIDELINE.md)
- [データベーススキーマ（SCHEMA.md）](./SCHEMA.md)
- [OGPテスト方法（OGP_TESTING.md）](./OGP_TESTING.md)

---

**最終更新**: 2025-10-09  
**次回レビュー**: Phase 10完了後
