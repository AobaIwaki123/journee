# モバイル版UI改善実装計画

## 📌 概要

### 目的
モバイル版（<768px）で進捗ゲージと情報収集ボタンを非表示にし、しおりの閲覧スペースを最大化する。

### 背景
- **問題点**: 画面が狭いのに進捗ゲージと情報収集ボタンで画面が占有され、しおりが見えづらい
- **採用案**: 思い切って削除する（改善案1）
- **理由**: シンプルで明快、実装コストが低い、チャットタブで代替可能

---

## 🎯 改善効果

### 画面レイアウトの比較

#### 改善前（モバイル: iPhone SE 667px）
```
┌─────────────────────────┐
│ Header (64px)           │
├─────────────────────────┤
│ Tab Switcher (48px)     │
├─────────────────────────┤
│ PlanningProgress (120px)│ ← 削除
├─────────────────────────┤
│ Itinerary Content       │
│ (残り: 約370px)         │
│                         │
├─────────────────────────┤
│ QuickActions (100px)    │ ← 削除
└─────────────────────────┘
しおり表示エリア: 約370px (55%)
```

#### 改善後（モバイル: iPhone SE 667px）
```
┌─────────────────────────┐
│ Header (64px)           │
├─────────────────────────┤
│ Tab Switcher (48px)     │
├─────────────────────────┤
│ Itinerary Content       │
│ (残り: 約555px)         │
│                         │
│                         │
│                         │
│                         │
└─────────────────────────┘
しおり表示エリア: 約555px (83%)
```

**改善効果**: しおり表示エリアが **約50%増加** （370px → 555px）

---

## 📊 変更サマリー

| 項目 | 内容 |
|------|------|
| 変更ファイル数 | **1ファイル** |
| 変更行数 | **約15行** |
| 破壊的変更 | **なし** |
| デスクトップへの影響 | **なし** |
| 実装時間目安 | **5分** |
| テスト時間目安 | **15分** |

---

## 🔧 実装内容

### 対象ファイル
`components/itinerary/ItineraryPreview.tsx`

### 変更箇所

#### 1. 自動進行中の進捗表示をデスクトップのみに（61-64行目）

**Before**:
```typescript
{/* Phase 4.10.3: 自動進行中の進捗表示 */}
{isAutoProgressing && autoProgressState && (
  <PhaseStatusBar state={autoProgressState} />
)}
```

**After**:
```typescript
{/* Phase 4.10.3: 自動進行中の進捗表示（デスクトップのみ） */}
{isAutoProgressing && autoProgressState && (
  <div className="hidden md:block">
    <PhaseStatusBar state={autoProgressState} />
  </div>
)}
```

---

#### 2. プランニング進捗をデスクトップのみに（66-67行目）

**Before**:
```typescript
{/* Phase 4: プランニング進捗（自動進行中でない場合のみ表示） */}
{!isAutoProgressing && <PlanningProgress />}
```

**After**:
```typescript
{/* Phase 4: プランニング進捗（自動進行中でない場合のみ表示、デスクトップのみ） */}
{!isAutoProgressing && (
  <div className="hidden md:block">
    <PlanningProgress />
  </div>
)}
```

---

#### 3. クイックアクションをデスクトップのみに（176-177行目）

**Before**:
```typescript
{/* Phase 4: クイックアクション（自動進行中でない場合のみ表示） */}
{!isAutoProgressing && <QuickActions />}
```

**After**:
```typescript
{/* Phase 4: クイックアクション（自動進行中でない場合のみ表示、デスクトップのみ） */}
{!isAutoProgressing && (
  <div className="hidden md:block">
    <QuickActions />
  </div>
)}
```

---

#### 4. EmptyItinerary内の進捗とクイックアクション（43-50行目）

**Before**:
```typescript
{/* Phase 4: プランニング進捗（初期状態でも表示） */}
{planningPhase !== 'initial' && <PlanningProgress />}

{/* 空状態 */}
<EmptyItinerary />

{/* Phase 4: クイックアクション */}
{planningPhase !== 'initial' && <QuickActions />}
```

**After**:
```typescript
{/* Phase 4: プランニング進捗（初期状態でも表示、デスクトップのみ） */}
{planningPhase !== 'initial' && (
  <div className="hidden md:block">
    <PlanningProgress />
  </div>
)}

{/* 空状態 */}
<EmptyItinerary />

{/* Phase 4: クイックアクション（デスクトップのみ） */}
{planningPhase !== 'initial' && (
  <div className="hidden md:block">
    <QuickActions />
  </div>
)}
```

---

## ✅ 実装手順

### Step 1: バックアップ（オプション）

```bash
# 現在のコードを確認
git status
git diff components/itinerary/ItineraryPreview.tsx

# バックアップブランチ作成（任意）
git checkout -b backup/mobile-ui-before-cleanup

# 元のブランチに戻る
git checkout main
```

### Step 2: 実装

1. `components/itinerary/ItineraryPreview.tsx` を開く
2. 上記の4箇所を修正
3. ファイルを保存

### Step 3: ビルド確認

```bash
npm run build
```

エラーがないことを確認します。

### Step 4: 開発サーバー起動

```bash
npm run dev
```

### Step 5: 動作確認（次セクション参照）

---

## 🧪 テスト計画

### 手動テストケース

#### ✅ テストケース1: デスクトップレイアウト（≥768px）

**手順**:
1. ブラウザを開き、幅を1024pxに設定
2. `http://localhost:3000` にアクセス
3. ログイン
4. チャットでしおりを作成（例: "3日間の京都旅行を計画して"）

**期待動作**:
- [ ] PlanningProgress が表示される
- [ ] PhaseStatusBar（自動進行時）が表示される
- [ ] QuickActions ボタンが表示される
- [ ] 各フェーズで進捗ゲージが正しく更新される

---

#### ✅ テストケース2: モバイルレイアウト（<768px）

**手順**:
1. Chrome DevToolsを開く（F12）
2. デバイスツールバーを有効化（Ctrl+Shift+M / Cmd+Shift+M）
3. デバイスを「iPhone SE」（375 x 667）に設定
4. `http://localhost:3000` にアクセス
5. ログイン
6. デフォルトで「しおり」タブが表示される

**期待動作**:
- [ ] PlanningProgress が**非表示**
- [ ] PhaseStatusBar が**非表示**
- [ ] QuickActions が**非表示**
- [ ] しおりが画面いっぱいに表示される

**手順（続き）**:
7. 「チャット」タブに切り替え
8. チャットでしおりを作成（例: "3日間の京都旅行を計画して"）
9. 「しおり」タブに戻る

**期待動作**:
- [ ] しおりが広く表示される
- [ ] 進捗UIやボタンが表示されない
- [ ] スクロールがスムーズ

---

#### ✅ テストケース3: レスポンシブ切り替え

**手順**:
1. デスクトップ幅（1024px）でアプリを起動
2. しおりを作成
3. ブラウザ幅を徐々に狭める: 1024px → 768px → 375px
4. 各ブレークポイントで表示を確認
5. 再度ブラウザ幅を広げる: 375px → 768px → 1024px

**期待動作**:
- [ ] 1024px: 進捗UIとボタンが表示
- [ ] 768px（境界）: 進捗UIとボタンが表示
- [ ] 767px以下: 進捗UIとボタンが非表示
- [ ] 768px以上に戻る: 進捗UIとボタンが再表示
- [ ] レイアウト崩れがない

---

#### ✅ テストケース4: 各フェーズでの動作確認（モバイル）

各フェーズで進捗UIが非表示になることを確認:

| フェーズ | 確認事項 |
|----------|----------|
| initial | 進捗UIなし、EmptyItinerary表示 |
| collecting | 進捗UI非表示、しおり作成中 |
| skeleton | 進捗UI非表示、骨組み表示 |
| detailing | 進捗UI非表示、詳細表示 |
| completed | 進捗UI非表示、完成しおり表示 |

---

#### ✅ テストケース5: タブ切り替え（モバイル）

**手順**:
1. モバイルレイアウト（375px）でアプリを起動
2. デフォルトで「しおり」タブが表示される
3. 「チャット」タブに切り替え
4. チャットでメッセージ送信
5. 「しおり」タブに戻る
6. 再度「チャット」タブに切り替え

**期待動作**:
- [ ] タブ切り替えがスムーズ
- [ ] しおりタブで進捗UIが非表示
- [ ] チャットタブで通常通りチャットできる
- [ ] 状態が保持される

---

### 確認デバイス・ブラウザ

#### 必須確認環境（Chrome DevTools）
- [ ] iPhone SE（375 x 667）
- [ ] iPhone 12 Pro（390 x 844）
- [ ] iPad（768 x 1024）※ボーダーライン
- [ ] Desktop（1024 x 768）

#### 推奨確認環境（実機）
- [ ] iPhone実機（Safari）
- [ ] Android実機（Chrome）
- [ ] iPad実機（Safari）

---

### E2Eテスト

既存のE2Eテストは**影響なし**（デスクトップで実行されるため）。

念のため既存テストを実行：

```bash
npm run test:e2e
```

**確認事項**:
- [ ] `e2e/map-toggle.spec.ts` - PASS
- [ ] `e2e/itinerary-db-integration.spec.ts` - PASS
- [ ] `e2e/comment-feature.spec.ts` - PASS
- [ ] `e2e/public-pdf-export.spec.ts` - PASS

---

## 🔄 ロールバック手順

万が一問題が発生した場合：

### 方法1: Git checkout
```bash
# 変更を元に戻す
git checkout components/itinerary/ItineraryPreview.tsx
```

### 方法2: バックアップから復元（バックアップブランチを作成した場合）
```bash
git checkout backup/mobile-ui-before-cleanup -- components/itinerary/ItineraryPreview.tsx
```

### 方法3: Git reset（コミット後）
```bash
# 直前のコミットに戻す
git reset --hard HEAD~1
```

---

## 📝 コミットメッセージ

```
feat(mobile): Hide progress and quick actions on mobile for better UX

モバイル版（<768px）でしおり表示スペースを最大化:
- PlanningProgress を非表示
- PhaseStatusBar を非表示
- QuickActions を非表示
- デスクトップ版（≥768px）は変更なし
- しおり表示エリアが約50%増加（370px → 555px）

進捗確認や操作はチャットタブで行う設計に変更。
モバイルではコンテンツ表示を優先する一般的なUXパターンに準拠。

Refs: #モバイルUI改善
```

---

## 📋 チェックリスト

### 実装前
- [ ] このドキュメントを読む
- [ ] 変更内容を理解する
- [ ] バックアップ作成（任意）

### 実装中
- [ ] 4箇所すべてを修正
- [ ] `hidden md:block` を正しく適用
- [ ] コメントを更新

### 実装後
- [ ] `npm run build` でエラーなし
- [ ] デスクトップで動作確認
- [ ] モバイルで動作確認
- [ ] レスポンシブ切り替え確認
- [ ] E2Eテスト実行
- [ ] コミット＆プッシュ

---

## 🎓 技術的補足

### Tailwindのレスポンシブクラス

```css
/* モバイルファースト設計 */
.hidden      /* すべてのサイズで非表示 */
.md:block    /* 768px以上で表示 */
```

このプロジェクトのブレークポイント:
- `md`: 768px（タブレット以上）
- デフォルト: 768px未満（モバイル）

### なぜ `hidden md:block` なのか？

Tailwindはモバイルファーストなので:
1. `hidden`: まずモバイルで非表示
2. `md:block`: 768px以上で表示

逆の `block md:hidden` だとデスクトップで非表示になってしまう。

---

## 🔮 今後の拡張案

この実装後、ユーザーフィードバックに基づいて以下を検討可能:

### オプション1: 最小化版の追加
モバイルでも折りたたみ可能な最小化進捗UIを追加

### オプション2: ヘッダーへの統合
進捗率（%）だけをヘッダーに表示

### オプション3: 完全削除
フィードバックが良好なら、コンポーネント自体を削除して保守性向上

---

## 📚 関連ドキュメント

- [プロジェクト構造](./README.md)
- [レスポンシブレイアウト実装](../components/layout/README.md)
- [モバイルレイアウト](../components/layout/MobileLayout.tsx)
- [デスクトップレイアウト](../components/layout/DesktopLayout.tsx)

---

## 📞 問い合わせ

実装中に問題が発生した場合:
1. このドキュメントの「ロールバック手順」を参照
2. Git履歴を確認（`git log --oneline`）
3. デバッグ情報を収集（スクリーンショット、エラーログ）

---

**最終更新**: 2025-10-09  
**ステータス**: 実装待ち  
**担当**: Frontend Team

