# Journee 実装計画

**最終更新**: 2025-10-09  
**現在のバージョン**: 0.10.0  
**現在のフェーズ**: Phase 10完了、Phase 11準備中

---

## 📊 現在の状況

### 完了済み機能
- ✅ Phase 1-8: 基本機能、認証、AI統合、データベース統合
- ✅ Phase 10: バグ修正とUX改善（閲覧ページPDF、OGP画像、DB統合）

### 既知の問題
- ⚠️ パフォーマンス指標が目標未達 → Phase 13で対応予定

---

## 📋 フェーズ概要

### Phase 10: バグ修正とUX改善 ✅ 完了
**完了日**: 2025-10-09

#### 完了タスク
1. **閲覧ページPDF機能修正** (Phase 10.1)
   - PDF出力ボタンの有効化
   - PDFプレビュー機能の修正

2. **OGP画像実装** (Phase 10.2)
   - 動的OGP画像生成API (`/app/api/og/route.tsx`)
   - SNS共有対応（Twitter Card, OpenGraph）
   - 1200x630px PNG画像生成

3. **フィードバックフォーム改善** (Phase 10.3)
   - プレースホルダー・入力テキストのコントラスト改善
   - WCAG 2.1 AA基準対応

4. **しおり保存のDB統合** (Phase 10.4)
   - SaveButtonのSupabase統合
   - StorageInitializerのDB読み込み
   - しおり一覧・マイページのDB統合
   - LocalStorageフォールバック実装

---

### Phase 11: コメント機能
**期間**: 2週間  
**ステータス**: 📝 計画中

#### Phase 11.1: データベーススキーマ
- [ ] `comments`テーブル作成（itinerary_id, user_id, content, is_anonymous）
- [ ] RLS設定（閲覧は全員、投稿・削除は認証ユーザー）
- [ ] インデックス作成

#### Phase 11.2: APIエンドポイント
- [ ] `GET /api/itinerary/[id]/comments` - コメント一覧取得
- [ ] `POST /api/itinerary/[id]/comments` - コメント投稿
- [ ] `DELETE /api/itinerary/[id]/comments/[commentId]` - コメント削除
- [ ] レート制限・バリデーション

#### Phase 11.3: UI実装
- [ ] CommentList.tsx, CommentItem.tsx（既存の改善）
- [ ] CommentForm.tsx - Googleユーザー名自動入力機能
- [ ] 閲覧ページへの統合
- [ ] リアルタイム更新（オプション: Supabase Realtime）

**関連ファイル**:
```
- lib/db/schema.sql（更新）
- app/api/itinerary/[id]/comments/route.ts（新規）
- components/comments/*（更新）
- app/share/[slug]/page.tsx（更新）
```

---

### Phase 12: フィードバック機能
**期間**: 1週間  
**ステータス**: 📝 計画中

#### Phase 12.1: GitHub API統合
- [ ] GitHub Personal Access Token取得
- [ ] `POST /api/feedback` - Issue自動作成
- [ ] カテゴリ別ラベル自動付与（bug/enhancement/question）

#### Phase 12.2: UI実装
- [x] FeedbackModal.tsx（既存）
- [ ] 閲覧ページにフィードバックボタン配置（フローティングボタン）
- [ ] 送信成功時のIssue URL表示

**関連ファイル**:
```
- app/api/feedback/route.ts（新規）
- app/share/[slug]/page.tsx（更新）
```

---

### Phase 13: パフォーマンス最適化
**期間**: 2週間  
**ステータス**: 📝 計画中

#### Phase 13.1: 初期ロード時間短縮
**現在**: 2.5秒 | **目標**: < 2秒

- [ ] コード分割（動的インポート）
  ```typescript
  const PDFPreviewModal = dynamic(() => import('@/components/itinerary/PDFPreviewModal'));
  ```
- [ ] 画像最適化（Next.js Image、WebP形式、遅延ロード）
- [ ] フォント最適化（サブセット化、font-display: swap）

#### Phase 13.2: Lighthouseスコア改善
**現在**: モバイル85、デスクトップ92 | **目標**: > 90 / > 95

- [ ] アクセシビリティ（ARIA属性、キーボードナビゲーション、カラーコントラスト）
- [ ] SEO（構造化データJSON-LD、sitemap.xml、セマンティックHTML）
- [ ] ベストプラクティス（HTTPS、セキュリティヘッダー、コンソールエラー解消）

**関連ファイル**:
```
- app/layout.tsx（メタタグ、フォント）
- next.config.js（画像最適化）
- middleware.ts（セキュリティヘッダー）
- app/sitemap.ts（新規）
```

---

### Phase 14: テストカバレッジ向上
**期間**: 2週間  
**ステータス**: 📝 計画中

#### 現在のカバレッジ
- ユニットテスト: 60% → **目標: 80%**
- 統合テスト: 40% → **目標: 70%**
- E2Eテスト: 30% → **目標: 60%**

#### Phase 14.1: ユニットテスト追加
- [ ] `lib/utils/`配下の関数
- [ ] `lib/ai/prompts.ts`パース関数
- [ ] `lib/store/`状態更新ロジック
- [ ] `lib/db/itinerary-repository.ts`CRUD操作

#### Phase 14.2: E2Eテスト追加
- [ ] 認証フロー（ログイン・ログアウト・セッション維持）
- [ ] しおり作成フロー（情報収集 → 骨組み → 詳細化 → 完成）
- [ ] 編集機能（インライン編集、Undo/Redo、D&D）
- [ ] 共有機能（公開URL発行、PDF出力、コメント投稿）

**関連ファイル**:
```
- lib/utils/__tests__/（新規）
- lib/store/__tests__/（新規）
- e2e/auth.spec.ts（新規）
- e2e/itinerary-creation.spec.ts（新規）
```

---

## 🎯 優先順位マトリクス

| Phase | 優先度 | 影響度 | 難易度 | 期間 | ステータス |
|-------|--------|--------|--------|------|-----------|
| 10 | ⭐⭐⭐ 高 | 高 | 低-中 | 1週間 | ✅ 完了 |
| 11 | ⭐⭐ 中 | 中 | 中 | 2週間 | 📝 計画中 |
| 12 | ⭐ 低 | 低 | 低 | 1週間 | 📝 計画中 |
| 13 | ⭐⭐ 中 | 高 | 中 | 2週間 | 📝 計画中 |
| 14 | ⭐⭐ 中 | 中 | 中 | 2週間 | 📝 計画中 |

---

## 📅 実装スケジュール

### ✅ 第1-2週: Phase 10 完了
- Day 1-2: 閲覧ページPDF機能修正
- Day 3-5: OGP画像実装
- Day 6: フィードバックフォーム改善
- Day 7-8: しおり保存のDB統合

### 第3-4週: Phase 11（コメント機能）
- Week 3前半: データベース設計・API実装
- Week 3後半: UI実装、Googleユーザー名自動入力
- Week 4: テスト・デバッグ・リリース

### 第5週: Phase 12（フィードバック機能）※優先度低
- Day 1-2: GitHub API統合
- Day 3: 閲覧ページにフィードバックボタン配置
- Day 4-5: テスト・デバッグ

### 第6-7週: Phase 13（パフォーマンス最適化）
- Week 6: 初期ロード時間短縮
- Week 7: Lighthouseスコア改善

### 第8-9週: Phase 14（テスト追加）
- Week 8: ユニットテスト追加
- Week 9: E2Eテスト追加

---

## 🔗 関連ドキュメント

- [リリース履歴（RELEASE.md）](./RELEASE.md)
- [バグ・改善点（BUG.md）](./BUG.md)
- [API仕様（API.md）](./API.md)
- [コーディングガイドライン（GUIDELINE.md）](./GUIDELINE.md)
- [データベーススキーマ（SCHEMA.md）](./SCHEMA.md)

---

**最終更新**: 2025-10-09  
**次回レビュー**: Phase 11開始前
