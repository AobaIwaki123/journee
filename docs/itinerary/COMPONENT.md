# コンポーネントリファクタリング計画

**作成日**: 2025-01-10  
**Phase**: 9 - 全コンポーネントの構成化

## 概要

Phase 8で ItineraryPreview をリファクタリングした手法を、他の大規模コンポーネントにも適用します。

---

## リファクタリング対象コンポーネント

### 🔴 高優先度 (300行以上)

#### 1. ShareButton.tsx (350行)
**現状**:
- モーダルUIを含む
- 公開設定フォームを含む
- URL生成・コピー処理を含む

**問題**:
- モーダルとボタンが混在
- フォームUIが巨大
- 複数の責務が混在

**提案コンポーネント**:
1. `ShareButton.tsx` (50行) - トリガーボタンのみ
2. `share/PublicSettingsModal.tsx` (100行) - モーダルコンテナ
3. `share/PublicSettingsForm.tsx` (80行) - 公開設定フォーム
4. `share/ShareUrlDisplay.tsx` (40行) - URL表示・コピー

**期待効果**: 350行 → 50行 (メイン) + 220行 (新規3個)

---

#### 2. DaySchedule.tsx (305行)
**現状**:
- スポットリスト表示
- D&D機能
- 空状態表示
- 統計情報表示

**問題**:
- D&Dロジックが複雑
- 空状態とリスト表示が混在
- 統計表示が埋め込まれている

**提案コンポーネント**:
1. `DaySchedule.tsx` (80行) - コンテナのみ
2. `day-schedule/DayScheduleHeader.tsx` (40行) - ヘッダー・統計
3. `day-schedule/SpotList.tsx` (60行) - スポットリスト
4. `day-schedule/EmptyDayMessage.tsx` (30行) - 空メッセージ
5. `day-schedule/DayStatistics.tsx` (50行) - 統計情報

**期待効果**: 305行 → 80行 (メイン) + 180行 (新規4個)

---

#### 3. PublicItineraryView.tsx (296行)
**現状**:
- ヘッダー表示
- スケジュール表示
- PDF出力ボタン
- コメント表示

**問題**:
- 公開ビュー特有のレイアウト
- 編集不可の表示ロジック
- コメントセクションが埋め込まれている

**提案コンポーネント**:
1. `PublicItineraryView.tsx` (80行) - コンテナのみ
2. `public/PublicItineraryHeader.tsx` (50行) - 公開ヘッダー
3. `public/PublicScheduleView.tsx` (80行) - スケジュール表示
4. `public/PublicItineraryFooter.tsx` (40行) - フッター・PDF

**期待効果**: 296行 → 80行 (メイン) + 170行 (新規3個)

---

#### 4. ItineraryCard.tsx (296行)
**現状**:
- カード表示（2つのバリアント）
- サムネイル表示
- メタ情報表示
- アクションボタン

**問題**:
- 2つのバリアントが混在
- メタ情報の表示ロジックが複雑
- アクションボタンが埋め込まれている

**提案コンポーネント**:
1. `ItineraryCard.tsx` (60行) - コンテナのみ
2. `card/ItineraryCardThumbnail.tsx` (40行) - サムネイル
3. `card/ItineraryCardMeta.tsx` (60行) - メタ情報
4. `card/ItineraryCardActions.tsx` (40行) - アクションボタン

**期待効果**: 296行 → 60行 (メイン) + 140行 (新規3個)

---

### 🟡 中優先度 (200-300行)

#### 5. AddSpotForm.tsx (264行)
**現状**:
- トリガーボタン
- フォーム表示（150行以上）
- バリデーション
- 送信処理

**問題**:
- フォームフィールドが多い（7個）
- フォームUIが巨大
- トリガーとフォームが混在

**提案コンポーネント**:
1. `AddSpotForm.tsx` (60行) - トリガー + コンテナ
2. `spot-form/SpotFormFields.tsx` (120行) - フォームフィールド群
3. `spot-form/SpotFormActions.tsx` (30行) - キャンセル・送信ボタン

**期待効果**: 264行 → 60行 (メイン) + 150行 (新規2個)

---

#### 6. ItineraryPDFLayout.tsx (195行)
**現状**:
- PDF専用レイアウト
- ヘッダー
- スケジュール
- フッター

**問題**:
- PDF特有のスタイリングが混在
- セクションごとの分離が不十分

**提案コンポーネント**:
1. `ItineraryPDFLayout.tsx` (60行) - レイアウトのみ
2. `pdf/PDFHeader.tsx` (40行) - PDFヘッダー
3. `pdf/PDFScheduleSection.tsx` (60行) - スケジュール
4. `pdf/PDFFooter.tsx` (30行) - PDFフッター

**期待効果**: 195行 → 60行 (メイン) + 130行 (新規3個)

---

### 🟢 低優先度 (150-200行)

#### 7. PlanningProgress.tsx (176行)
**現状**:
- 進捗バー表示
- フェーズステータス
- チェックリスト表示

**提案**: 現状維持（適切なサイズ、複雑な分割は不要）

#### 8. ItineraryFilters.tsx (176行)
**現状**:
- フィルター UI
- フィルター状態管理

**提案**: 現状維持（フィルターUIは一体化が適切）

---

## 共通コンポーネントの抽出

### 1. FormField コンポーネント (新規)
**用途**: AddSpotForm, SpotEditForm で使用

```tsx
// components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);
```

**削減効果**: AddSpotForm + SpotEditForm で約40行削減

---

### 2. FormActions コンポーネント (新規)
**用途**: AddSpotForm, SpotEditForm で使用

```tsx
// components/ui/FormActions.tsx
interface FormActionsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onSubmit,
  cancelLabel = 'キャンセル',
  submitLabel = '保存',
  submitDisabled = false,
}) => (
  <div className="flex gap-2">
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {cancelLabel}
    </button>
    {onSubmit && (
      <button
        type="submit"
        disabled={submitDisabled}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
      >
        {submitLabel}
      </button>
    )}
  </div>
);
```

**削減効果**: 複数フォームで約30行削減

---

### 3. EmptyState コンポーネント (新規)
**用途**: EmptyItinerary, EmptyScheduleMessage, EmptyDayMessage で使用

```tsx
// components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6 md:p-12 text-center">
    {icon && <div className="mb-4 flex justify-center">{icon}</div>}
    <p className="text-gray-600 text-base md:text-lg font-medium mb-2">
      {title}
    </p>
    {description && (
      <p className="text-sm text-gray-500">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
```

**削減効果**: 複数の空状態で約50行削減

---

### 4. Modal コンポーネント (新規)
**用途**: ShareButton, PDFPreviewModal で使用

```tsx
// components/ui/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto ${sizeClasses[size]}`}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="sticky bottom-0 bg-white border-t px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```

**削減効果**: モーダル使用箇所で約60行削減

---

## 実装順序

### Phase 9.1: 共通コンポーネント作成 (1時間)
1. components/ui/FormField.tsx
2. components/ui/FormActions.tsx
3. components/ui/EmptyState.tsx
4. components/ui/Modal.tsx

**期待効果**: 基盤整備、後続フェーズで活用

---

### Phase 9.2: AddSpotForm リファクタリング (1時間)
1. spot-form/SpotFormFields.tsx 作成
2. spot-form/SpotFormActions.tsx 作成
3. AddSpotForm.tsx 簡素化

**期待効果**: 264行 → 60行 (-204行)

---

### Phase 9.3: ShareButton リファクタリング (2時間)
1. share/PublicSettingsModal.tsx 作成
2. share/PublicSettingsForm.tsx 作成
3. share/ShareUrlDisplay.tsx 作成
4. ShareButton.tsx 簡素化

**期待効果**: 350行 → 50行 (-300行)

---

### Phase 9.4: DaySchedule リファクタリング (2時間)
1. day-schedule/DayScheduleHeader.tsx 作成
2. day-schedule/SpotList.tsx 作成
3. day-schedule/EmptyDayMessage.tsx 作成
4. day-schedule/DayStatistics.tsx 作成
5. DaySchedule.tsx 簡素化

**期待効果**: 305行 → 80行 (-225行)

---

### Phase 9.5: PublicItineraryView リファクタリング (1.5時間)
1. public/PublicItineraryHeader.tsx 作成
2. public/PublicScheduleView.tsx 作成
3. public/PublicItineraryFooter.tsx 作成
4. PublicItineraryView.tsx 簡素化

**期待効果**: 296行 → 80行 (-216行)

---

### Phase 9.6: ItineraryCard リファクタリング (1.5時間)
1. card/ItineraryCardThumbnail.tsx 作成
2. card/ItineraryCardMeta.tsx 作成
3. card/ItineraryCardActions.tsx 作成
4. ItineraryCard.tsx 簡素化

**期待効果**: 296行 → 60行 (-236行)

---

### Phase 9.7: ItineraryPDFLayout リファクタリング (1時間)
1. pdf/PDFHeader.tsx 作成
2. pdf/PDFScheduleSection.tsx 作成
3. pdf/PDFFooter.tsx 作成
4. ItineraryPDFLayout.tsx 簡素化

**期待効果**: 195行 → 60行 (-135行)

---

## 総合効果

### コード削減

| コンポーネント | Before | After | 削減 |
|---------------|--------|-------|------|
| AddSpotForm | 264行 | 60行 | -204行 |
| ShareButton | 350行 | 50行 | -300行 |
| DaySchedule | 305行 | 80行 | -225行 |
| PublicItineraryView | 296行 | 80行 | -216行 |
| ItineraryCard | 296行 | 60行 | -236行 |
| ItineraryPDFLayout | 195行 | 60行 | -135行 |
| **合計** | **1706行** | **390行** | **-1316行** |

### 新規作成

- **共通コンポーネント**: 4個 (約200行)
- **専用コンポーネント**: 20個 (約1000行)
- **合計**: 24個 (約1200行)

### 最終効果

- **メインコンポーネント削減**: -1316行
- **新規コンポーネント追加**: +1200行
- **正味削減**: -116行
- **平均コンポーネントサイズ**: 約50行（理想的）

---

## 成功基準

### 定量的基準
- ✅ 300行以上のコンポーネント: 0個
- ✅ 平均コンポーネントサイズ: 80行以下
- ✅ 共通コンポーネント活用: 4個以上
- ✅ コメント削減: 80%以上

### 定性的基準
- ✅ 各コンポーネントの責務が明確
- ✅ 再利用可能なコンポーネント群
- ✅ テスト容易性の向上
- ✅ 保守性の大幅向上

---

## リスク管理

### 低リスク
- 既存機能は変更しない（ロジック移動のみ）
- E2Eテストで動作確認
- 段階的な実装（Phase 9.1 → 9.7）

### 対策
- 各フェーズ後にビルド確認
- 問題発生時はロールバック可能
- コミット単位を小さく保つ

---

**作成日**: 2025-01-10  
**ステータス**: 📋 計画確定  
**次のステップ**: Phase 9.1 - 共通コンポーネント作成
