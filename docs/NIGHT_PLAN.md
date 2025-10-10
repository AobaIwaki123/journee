# 夜間自動実行計画

**実行開始**: 2025-01-10 夜  
**推定完了**: 2025-01-11 朝  
**推定時間**: 10-14時間

---

## 実行方針

### プッシュタイミング
- ✅ **最後のみプッシュ** (GitHub Action回避)
- 各Phaseごとにコミット（ロールバック可能に）
- 最終的に1回のプッシュで全変更を反映

### エラーハンドリング
- ビルドエラー発生時は詳細調査
- 3回まで自動リトライ
- 解決できない場合はスキップして次へ

### 進捗確認ポイント
1. Phase 10.1-10.4完了後
2. Phase 11完了後
3. Phase 12完了後
4. Phase 13完了後

---

## Phase 10: Store完全統合 (4-5時間)

### Phase 10.1: Chat & AI Store (2-3時間) 🔄 進行中

#### 完了済み
- ✅ lib/store/chat/useChatStore.ts
- ✅ lib/store/ai/useAIStore.ts
- ✅ lib/hooks/chat/useChatHistory.ts

#### 残タスク
1. **useChatMessage.tsの修正**
   - sendChatMessageStreamの正しい使用方法
   - MessageInput.tsxの実装を参考
   - iteratorパターンで実装

2. **コンポーネント移行 (6個)**
   - `MessageInput.tsx` - useChatMessage使用
   - `MessageList.tsx` - useChatHistory使用
   - `ChatBox.tsx` - useChatStore使用
   - `AISelector.tsx` - useAIStore使用
   - `MessageSkeleton.tsx` - useChatStore使用
   - `QuickActions.tsx` - useAIStore使用 (AI選択部分のみ)

3. **useStore削除 (Chat/AI関連)**
   - messages, isLoading, isStreaming, streamingMessage
   - selectedAI, claudeApiKey
   - 関連アクション

---

### Phase 10.2: Settings Store (1.5-2時間)

#### 作成ファイル
1. `lib/store/settings/useSettingsStore.ts` (150行)
   - settings, soundEnabled, soundVolume
   - updateSettings, setSoundEnabled, setSoundVolume
   - LocalStorage同期

2. `lib/hooks/settings/useAppSettings.ts` (120行)
   - 設定読み込み・保存
   - デフォルト値管理
   - バリデーション

3. `lib/store/settings/index.ts`
4. `lib/hooks/settings/index.ts`

#### 修正ファイル (8個)
- `GeneralSettings.tsx` - useSettingsStore使用
- `AccountSettings.tsx` - useSettingsStore使用
- `SoundSettings.tsx` - useSettingsStore使用
- `AISettings.tsx` - useAIStore使用（既に移行）
- `settings/page.tsx` - useSettingsStore使用
- `MessageInput.tsx` - currency参照更新
- `MessageList.tsx` - currency参照更新
- `QuickActions.tsx` - currency参照更新

#### useStore削除
- settings, soundEnabled, soundVolume
- updateSettings, updateGeneralSettings, updateSoundSettings
- setSoundEnabled, setSoundVolume

---

### Phase 10.3: UI Store (1.5-2時間)

#### 作成ファイル
1. `lib/store/ui/useUIStore.ts` (200行)
   - toasts, isSaving, lastSaveTime
   - storageInitialized, error
   - addToast, removeToast, setSaving, setLastSaveTime
   - setStorageInitialized, setError, clearError

2. `lib/store/ui/index.ts`

#### 修正ファイル (20個以上)
**Toast使用箇所 (15個)**:
- `ToastContainer.tsx`
- `DaySchedule.tsx`
- `SpotCard.tsx`
- `AddSpotForm.tsx`
- `SaveButton.tsx`
- `ShareButton.tsx`
- `ResetButton.tsx`
- `QuickActions.tsx`
- `EditableTitle.tsx`
- `MapView.tsx`
- その他5個以上

**Save Status使用箇所 (3個)**:
- `SaveStatus.tsx`
- `AutoSave.tsx`
- `StorageInitializer.tsx`

**Error使用箇所 (3個)**:
- `ErrorNotification.tsx`
- `MessageInput.tsx`
- `MessageList.tsx`

#### useStore削除
- toasts, isSaving, lastSaveTime
- storageInitialized, error
- すべての関連アクション

---

### Phase 10.4: Layout Store & useStore削除 (1時間)

#### 作成ファイル
1. `lib/store/layout/useLayoutStore.ts` (80行)
   - chatPanelWidth, mobileActiveTab
   - setChatPanelWidth, setMobileActiveTab, toggleMobileMenu
   - LocalStorage同期

2. `lib/store/layout/index.ts`

#### 修正ファイル (4個)
- `ResizableLayout.tsx`
- `ResizablePanel.tsx`
- `MobileLayout.tsx`
- `MobileMenu.tsx`

#### 最終作業
1. **useStore完全排除確認**
   ```bash
   grep -r "useStore" components/ | wc -l  # → 0
   grep -r "useStore" lib/hooks/ | wc -l   # → 0
   ```

2. **useStore.ts削除**
   - `lib/store/useStore.ts` (1162行) → 削除
   - `lib/store/useStore-helper.ts` → 必要な関数を各ストアに移行してから削除

3. **インポート整理**
   - 全ファイルのインポート文を確認
   - 壊れた参照を修正

---

## Phase 11: AI最適化 (3-4時間) 🚧 準備中

### Phase 11.1: AI呼び出し統合 (1.5-2時間)

#### 新規作成
1. `lib/hooks/ai/useAIRequest.ts` (180行)
   - 統一されたAI呼び出しロジック
   - エラーハンドリング
   - リトライロジック
   - プログレス表示

#### リファクタリング
- `lib/hooks/itinerary/useAIProgress.ts` - useAIRequest活用
- `lib/hooks/chat/useChatMessage.ts` - useAIRequest活用
- `lib/ai/prompts.ts` - 整理
- `lib/execution/sequential-itinerary-builder.ts` - 簡素化

---

### Phase 11.2: ストリーミング最適化 (1-1.5時間)

#### 最適化項目
1. **チャンク処理**
   - バッファリング戦略
   - UI更新頻度調整

2. **JSONパース**
   - parseAIResponse最適化
   - 部分的JSONパース

3. **キャンセル処理**
   - AbortController管理
   - メモリリーク防止

---

### Phase 11.3: プロンプト管理 (0.5-1時間)

#### 新規作成
```
lib/ai/prompt-templates/
├── gathering.ts
├── skeleton.ts
├── detailing.ts
├── review.ts
└── index.ts
```

---

## Phase 12: パフォーマンス (3-4時間) 🚧 準備中

### Phase 12.1: メモ化 (1-1.5時間)

#### 対象コンポーネント (10個)
- MessageList.tsx
- DaySchedule.tsx
- SpotCard.tsx
- ItineraryPreview.tsx
- ItinerarySummary.tsx
- MapView.tsx
- PDFExportButton.tsx
- PublicItineraryView.tsx
- ItineraryCard.tsx
- ShareButton.tsx

#### 実装
- React.memo
- useMemo
- useCallback

---

### Phase 12.2: コード分割 (1時間)

#### 動的インポート対象
1. PDF関連 (PDFExportButton, PDFPreviewModal)
2. Map関連 (MapView)
3. Modal関連 (全モーダル)
4. 重いライブラリ (ReactMarkdown, DnD, html2canvas, jsPDF)

---

### Phase 12.3: 仮想スクロール (1-1.5時間)

#### 対象
- MessageList (messages > 50)
- ItineraryList (itineraries > 20)
- SpotList (spots > 20)

---

## Phase 13: テスト & ドキュメント (3-4時間) 🚧 準備中

### Phase 13.1: Hooksテスト (1.5-2時間)

#### 新規テスト (6個)
- useChatMessage.test.ts
- useChatHistory.test.ts
- useAppSettings.test.ts
- useAIRequest.test.ts
- useItinerarySave.test.ts (拡充)
- usePhaseTransition.test.ts (拡充)

---

### Phase 13.2: E2Eテスト (1-1.5時間)

#### 新規テスト (4個)
- e2e/full-itinerary-creation.spec.ts
- e2e/error-recovery.spec.ts
- e2e/performance.spec.ts
- e2e/responsive.spec.ts

---

### Phase 13.3: ドキュメント (0.5-1時間)

#### 作成ドキュメント
1. `docs/ARCHITECTURE.md` (300行)
2. `docs/GUIDELINE.md` - 刷新
3. `docs/API.md` - 更新
4. `docs/itinerary/REFACTORING_FINAL_SUMMARY.md` (500行)

---

## 成功基準チェックリスト

### コード品質
- [ ] useStore直接使用: 0箇所
- [ ] 平均コンポーネント行数: <100行
- [ ] カスタムHooks: 15個以上
- [ ] Storeスライス: 9個
- [ ] 総コード削減: -2000行以上

### パフォーマンス
- [ ] 初期ロード: <2秒
- [ ] チャット応答: <100ms
- [ ] PDF生成: <5秒
- [ ] メモリ使用: <100MB

### テスト
- [ ] Hookカバレッジ: >90%
- [ ] Storeカバレッジ: >80%
- [ ] E2Eテスト: 10シナリオ
- [ ] すべてパス

### ドキュメント
- [ ] ARCHITECTURE.md作成
- [ ] GUIDELINE.md更新
- [ ] API.md更新
- [ ] REFACTORING_FINAL_SUMMARY.md作成

---

## コミット戦略

### コミットメッセージ形式
```
<type>: <description>

<details>

影響: <affected files count>個
削減: <line reduction>行
```

### 推定コミット数
- Phase 10.1: 1コミット
- Phase 10.2: 1コミット
- Phase 10.3: 1コミット
- Phase 10.4: 1コミット（useStore削除）
- Phase 11.1-11.3: 3コミット
- Phase 12.1-12.3: 3コミット
- Phase 13.1-13.3: 3コミット
- **合計**: 13コミット

### 最終プッシュ
```bash
git push origin cursor/refactor-itinerary-with-checkpoints-6a6f
```

---

## エラーリカバリー

### ビルドエラー時
1. エラーメッセージを詳細に読む
2. 関連ファイルを確認
3. 型定義を確認
4. インポートパスを確認
5. 3回リトライ
6. 解決できない場合はスキップ

### テストエラー時
1. テストログを確認
2. 該当コードを確認
3. モックを確認
4. 1回リトライ
5. 解決できない場合は次へ

---

## 最終チェック

### 実行前
- [ ] docs/REFACTOR.md確認
- [ ] docs/NIGHT_PLAN.md確認
- [ ] git status確認（クリーンな状態）

### 実行後
- [ ] ビルド成功
- [ ] テスト実行
- [ ] コミット数確認 (13個)
- [ ] ドキュメント完成
- [ ] 最終プッシュ

---

**準備完了！おやすみなさい🌙**  
**起きた時には美しいアーキテクチャが完成しています✨**
