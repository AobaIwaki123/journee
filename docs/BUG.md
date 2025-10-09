# Journee バグ・改善点

このドキュメントは、Journeeプロジェクトの既知のバグ、改善点、将来的な機能追加のアイデアを記録しています。

**最終更新**: 2025-10-09

---

## 🐛 現在の既知のバグ

### バグ#1: モバイルUI改善後に背景がスクロールできない ✅ 解決済み

**発見日**: 2025-10-09  
**解決日**: 2025-10-09  
**ステータス**: 🟢 解決済み  
**優先度**: 高  
**影響範囲**: モバイル版（<768px）のしおりプレビュー

#### バグの概要
モバイルUI改善実装（PlanningProgress、PhaseStatusBar、QuickActionsを`hidden md:block`で非表示化）後、背景がスクロールできなくなった。

#### 再現手順
1. モバイルサイズ（375px）でアプリを起動
2. しおりタブを表示
3. スクロールしようとする

#### 期待される動作
しおりコンテンツが通常通りスクロールできる

#### 実際の動作
背景がスクロールできない

#### 原因
- `hidden md:block`のwrapper `div`要素がflexレイアウトに影響していた
- wrapper divがflex子要素として追加されたことで、高さ計算が狂った

#### 解決方法
1. PlanningProgress、PhaseStatusBar、QuickActionsに`className` propを追加
2. wrapper divを削除し、`className="hidden md:block"`を直接コンポーネントに適用
3. これにより、flexレイアウトを壊さずにレスポンシブ表示を実現

#### 変更ファイル
- components/itinerary/PlanningProgress.tsx
- components/itinerary/PhaseStatusBar.tsx
- components/itinerary/QuickActions.tsx
- components/itinerary/ItineraryPreview.tsx

#### 環境
- ブランチ: cursor/implement-mobile-ui-improvement-plan-20d1

---

## 📝 改善提案

### UX改善
- [ ] 初期ロード時間の短縮（目標: 2秒以内）
- [ ] モバイルLighthouseスコア向上（目標: 90以上）
- [ ] アクセシビリティ対応の強化

### 機能追加
- [ ] スクリーンショット添付機能（フィードバック）
- [ ] リアルタイム通知（Slack/メール）
- [ ] フィードバック履歴ページ
- [ ] オフライン編集対応

---

## 🔗 報告方法

バグや改善点を発見した場合は、以下のテンプレートを使用して報告してください：

### バグ報告テンプレート
```
### バグの概要
[簡潔な説明]

### 再現手順
1. [ステップ1]
2. [ステップ2]

### 期待される動作
[本来どうあるべきか]

### 実際の動作
[実際に何が起こるか]

### 環境
- OS: [e.g., macOS 14]
- ブラウザ: [e.g., Chrome 120]
- デバイス: [e.g., デスクトップ]
```

### 改善提案テンプレート
```
### 提案の概要
[改善提案の簡潔な説明]

### 背景・動機
[なぜこの改善が必要か]

### 提案内容
[具体的にどう改善するか]

### 期待される効果
[この改善によって得られるメリット]
```

---

## 🔗 関連ドキュメント

- [実装計画（PLAN.md）](./PLAN.md)
- [リリース履歴（RELEASE.md）](./RELEASE.md)
- [テストガイド（TESTING.md）](./TESTING.md)
