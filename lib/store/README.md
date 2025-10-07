# Zustand Store リファクタリング

## 概要

`useStore.ts` (766行) を責務ごとに分割しました。

## ストア構造

```
lib/store/
├── useStore.ts              # メインストア（統合）
├── useStore-helper.ts       # ヘルパー関数
├── slices/                  # スライス（機能ごとの分割）
│   ├── chatSlice.ts         # チャット状態
│   ├── uiSlice.ts           # UI状態
│   ├── toastSlice.ts        # トースト通知
│   ├── settingsSlice.ts     # 設定
│   ├── historySlice.ts      # Undo/Redo履歴
│   └── itinerarySlice.ts    # しおり状態（最大）
└── __tests__/               # テスト
    └── phase-transitions.test.ts
```

## スライス詳細

### ChatSlice (`chatSlice.ts`)
- **責務**: チャット機能の状態管理
- **状態**: messages, isLoading, isStreaming, streamingMessage
- **操作**: addMessage, setLoading, setStreaming, clearMessages

### UISlice (`uiSlice.ts`)
- **責務**: UI関連の状態管理
- **状態**: error, selectedAI, claudeApiKey, selectedTemplate, isSaving
- **操作**: setError, setSelectedAI, setClaudeApiKey, setSelectedTemplate

### ToastSlice (`toastSlice.ts`)
- **責務**: トースト通知の管理
- **状態**: toasts
- **操作**: addToast, removeToast

### SettingsSlice (`settingsSlice.ts`)
- **責務**: アプリケーション設定
- **状態**: settings, autoProgressMode, autoProgressSettings, filters, sort
- **操作**: updateSettings, setAutoProgressMode, setItineraryFilter

### HistorySlice (`historySlice.ts`)
- **責務**: Undo/Redo機能
- **状態**: history (past, present, future)
- **操作**: undo, redo, canUndo, canRedo, addToHistory

### ItinerarySlice (`itinerarySlice.ts`)
- **責務**: 旅のしおりの状態管理
- **状態**: currentItinerary, planningPhase, currentDetailingDay, checklist
- **操作**: setItinerary, updateSpot, deleteSpot, addSpot, reorderSpots, etc.

## 使用方法

### Before (モノリシック)
```typescript
import { useStore } from '@/lib/store/useStore';

const Component = () => {
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  // ...
};
```

### After (分割後も同じAPI)
```typescript
import { useStore } from '@/lib/store/useStore';

// APIは変更なし - 内部実装のみ変更
const Component = () => {
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  // ...
};
```

## 利点

1. **可読性**: 各スライスは100-200行で管理しやすい
2. **保守性**: 機能ごとに責務が明確
3. **テスタビリティ**: 個別にテスト可能
4. **パフォーマンス**: 必要な状態のみサブスクライブ
5. **拡張性**: 新しいスライスを追加しやすい

## テスト

各スライスは独立してテストできます：

```typescript
import { create } from 'zustand';
import { createChatSlice } from './slices/chatSlice';

describe('ChatSlice', () => {
  it('should add message', () => {
    const store = create(createChatSlice);
    // テストコード
  });
});
```

## マイグレーション

既存のコードは変更不要です。`useStore` のAPIは完全に互換性があります。

## 今後の改善

- [ ] 各スライスの単体テスト追加
- [ ] パフォーマンス計測
- [ ] ミドルウェア追加（devtools, persist）
- [ ] 型安全性の更なる向上