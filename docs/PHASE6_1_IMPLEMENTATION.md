# Phase 6.1: APIキー管理機能 実装完了レポート

**実装日**: 2025-10-07  
**Phase**: 6.1 - APIキー管理  
**ステータス**: ✅ 完了

---

## 📋 実装概要

Phase 6.1では、Claude APIキーの管理機能を実装しました。ユーザーがUI上からAPIキーを登録・管理でき、LocalStorageに暗号化して保存する仕組みを構築しました。

### 実装内容

1. ✅ **暗号化/復号化ユーティリティ** (`lib/utils/encryption.ts`)
2. ✅ **LocalStorageヘルパー** (`lib/utils/storage.ts`)
3. ✅ **Zustandストアの拡張** (`lib/store/useStore.ts`)
4. ✅ **APIキー設定モーダル** (`components/settings/APIKeyModal.tsx`)
5. ✅ **Claude APIキー検証機能** (`lib/ai/claude.ts`)
6. ✅ **Headerに設定ボタン追加** (`components/layout/Header.tsx`)
7. ✅ **AISelectorの更新** (`components/chat/AISelector.tsx`)
8. ✅ **LocalStorage初期化処理** (`components/layout/StorageInitializer.tsx`)

---

## 🗂️ 新規作成ファイル

### 1. `lib/utils/encryption.ts`
**目的**: APIキーの暗号化/復号化機能

**主要機能**:
- `encrypt(text)`: 文字列をXOR暗号化してBase64エンコード
- `decrypt(encryptedText)`: 暗号化された文字列を復号化
- `validateApiKeyFormat(apiKey)`: APIキー形式の簡易検証
- `maskApiKey(apiKey)`: APIキーのマスク表示（例: `sk-ant-***...xyz123`）

**セキュリティ**:
- XOR暗号を使用した簡易的な暗号化
- Base64エンコードで保存
- 注意: 完全なセキュリティを保証するものではなく、基本的な保護のみ

### 2. `lib/utils/storage.ts`
**目的**: LocalStorageへの安全なアクセス提供

**主要機能**:
- `saveClaudeApiKey(apiKey)`: APIキーを暗号化して保存
- `loadClaudeApiKey()`: 保存されたAPIキーを復号化して取得
- `removeClaudeApiKey()`: APIキーを削除
- `hasClaudeApiKey()`: APIキーの保存確認
- `saveSelectedAI(ai)`: 選択AIの保存
- `loadSelectedAI()`: 選択AIの取得
- `clearAllAppData()`: すべてのアプリデータをクリア

**ストレージキー**:
```typescript
STORAGE_KEYS = {
  CLAUDE_API_KEY: 'journee_claude_api_key',
  SELECTED_AI: 'journee_selected_ai',
  PANEL_WIDTH: 'journee_panel_width', // Phase 7用
}
```

### 3. `components/settings/APIKeyModal.tsx`
**目的**: APIキー設定用のモーダルUI

**機能**:
- APIキーの入力・保存
- APIキーの表示/非表示切り替え
- 現在のAPIキーのマスク表示
- APIキーの削除
- バリデーション結果の表示
- Anthropic Console へのリンク

**UX機能**:
- パスワード型入力（目アイコンで表示切り替え）
- リアルタイムバリデーション
- 成功/エラーメッセージ表示
- セキュリティに関する注意書き

### 4. `lib/ai/claude.ts`
**目的**: Claude API統合の基盤（Phase 6.2で完全実装）

**Phase 6.1実装内容**:
- `validateClaudeApiKey(apiKey)`: APIキー形式の検証
  - `sk-ant-` で始まることを確認
  - 最低文字数チェック（50文字以上）
  - Phase 6.2で実際のAPI呼び出しによる検証を追加予定

**Phase 6.2実装予定**:
- `sendClaudeMessage()`: Claude APIでチャット送信
- `sendClaudeMessageStream()`: ストリーミング対応チャット

### 5. `components/layout/StorageInitializer.tsx`
**目的**: アプリ起動時にLocalStorageからデータを復元

**機能**:
- `useEffect`で初回レンダリング時に`initializeFromStorage()`を実行
- APIキーと選択AIをLocalStorageから復元
- 何も表示しない（内部処理のみ）

---

## 🔄 更新ファイル

### 1. `lib/store/useStore.ts`

**追加機能**:
```typescript
interface AppState {
  // 新規追加
  removeClaudeApiKey: () => void;
  initializeFromStorage: () => void;
}
```

**変更内容**:
- `setSelectedAI`: LocalStorageに自動保存
- `setClaudeApiKey`: LocalStorageに暗号化して自動保存
- `removeClaudeApiKey`: APIキーを削除してGeminiに切り替え
- `initializeFromStorage`: LocalStorageから初期データを復元

### 2. `components/layout/Header.tsx`

**追加要素**:
- 設定ボタン（歯車アイコン）
- `APIKeyModal`コンポーネントの統合
- モーダルの開閉状態管理

**UI変更**:
```tsx
{/* 設定ボタン */}
{session && (
  <button onClick={() => setIsSettingsOpen(true)}>
    <Settings className="w-5 h-5" />
    <span className="hidden sm:inline">設定</span>
  </button>
)}
```

### 3. `components/chat/AISelector.tsx`

**追加機能**:
- Claude選択時のAPIキー確認
- APIキー未設定時はモーダルを自動表示
- Claude選択中の警告表示（Phase 6.2未実装）
- AIモデル名の更新（"Gemini 2.5 Pro", "Claude 3.5 Sonnet"）

**動作フロー**:
```typescript
const handleAIChange = (ai) => {
  if (ai === 'claude' && !claudeApiKey) {
    // APIキー未設定の場合、モーダル表示
    setIsModalOpen(true);
    return;
  }
  setSelectedAI(ai);
};
```

### 4. `app/page.tsx`

**追加要素**:
- `StorageInitializer`コンポーネントの統合
- LocalStorageからデータ復元処理

---

## 🎨 UI/UX

### APIキー設定モーダルの特徴

1. **シンプルなデザイン**
   - 中央配置のモーダル
   - クリーンなホワイトカード
   - 青を基調としたアクセントカラー

2. **ユーザー体験**
   - APIキーの表示/非表示切り替え（目アイコン）
   - リアルタイムバリデーション
   - 成功/エラーメッセージのビジュアルフィードバック
   - 現在のAPIキーをマスク表示（`sk-ant-***...xyz123`）

3. **セキュリティ通知**
   - LocalStorageに暗号化保存される旨を明記
   - 共有PCでの使用に関する注意書き
   - APIキー削除ボタンの提供

4. **アクセシビリティ**
   - キーボード操作対応
   - スクリーンリーダー対応（title属性）
   - レスポンシブデザイン（モバイル対応）

---

## 🔐 セキュリティ対策

### 暗号化方式
- **アルゴリズム**: XOR暗号（排他的論理和）
- **エンコード**: Base64
- **暗号化キー**: 固定文字列（本番環境では環境変数推奨）

### 制限事項
⚠️ **重要**: この暗号化は基本的な保護のみを提供します。
- XOR暗号は解読が比較的容易
- ブラウザのLocalStorageは完全に安全ではない
- 共有PCでは使用後にAPIキーを削除することを推奨

### 推奨される改善（将来的）
1. サーバーサイドでのAPIキー管理
2. より強固な暗号化アルゴリズム（AES等）
3. ユーザーごとのデータベース保存
4. APIキーの有効期限管理

---

## 📊 データフロー

### APIキー保存フロー
```
ユーザー入力
  ↓
APIKeyModal（バリデーション）
  ↓
validateApiKeyFormat（形式チェック）
  ↓
useStore.setClaudeApiKey
  ↓
encrypt（暗号化）
  ↓
LocalStorage保存
```

### アプリ起動時の復元フロー
```
アプリ起動
  ↓
StorageInitializer（useEffect）
  ↓
useStore.initializeFromStorage
  ↓
loadClaudeApiKey（LocalStorageから取得）
  ↓
decrypt（復号化）
  ↓
Zustandストアに保存
  ↓
UIに反映
```

### Claude選択時のフロー
```
AISelector変更
  ↓
handleAIChange('claude')
  ↓
claudeApiKey存在確認
  ↓
[未設定の場合]
  ↓
APIKeyModal表示
  ↓
APIキー入力・保存
  ↓
Claude選択可能に

[設定済みの場合]
  ↓
Claude選択
  ↓
警告表示（Phase 6.2未実装）
```

---

## 🧪 テストガイド

### 1. APIキー登録テスト

#### ケース1: 正常なAPIキー登録
1. ヘッダーの「設定」ボタンをクリック
2. APIキー入力欄に有効なClaude APIキーを入力
   - 例: `sk-ant-api03-abcd...xyz123`（実際のキー）
3. 「保存」ボタンをクリック
4. ✅ 「APIキーを保存しました」と表示される
5. ✅ モーダルが1秒後に自動的に閉じる
6. ✅ ページをリロードしてもAPIキーが保持される

#### ケース2: 不正なAPIキー形式
1. モーダルを開く
2. 短いテキストを入力（例: `test`）
3. 「保存」ボタンをクリック
4. ❌ エラーメッセージ表示:
   - "APIキーの形式が正しくありません（最低20文字必要）"

#### ケース3: 空のAPIキー
1. モーダルを開く
2. 何も入力せずに「保存」ボタンをクリック
3. ❌ エラーメッセージ表示: "APIキーを入力してください"

### 2. APIキー削除テスト

1. APIキーを登録済みの状態で設定モーダルを開く
2. ✅ 登録済みキーがマスク表示される（例: `sk-ant-***...xyz123`）
3. 「APIキーを削除」ボタンをクリック
4. 確認ダイアログで「OK」をクリック
5. ✅ APIキーが削除される
6. ✅ 選択AIが自動的にGeminiに切り替わる
7. ✅ LocalStorageからもAPIキーが削除される

### 3. AI選択テスト

#### ケース1: APIキー未設定でClaude選択
1. APIキーが未設定の状態
2. AIセレクターで「Claude 3.5 Sonnet (APIキー必要)」を選択
3. ✅ APIキー設定モーダルが自動的に表示される
4. APIキーを登録
5. ✅ Claude選択状態になる

#### ケース2: APIキー設定済みでClaude選択
1. APIキーを事前に登録
2. AIセレクターで「Claude 3.5 Sonnet」を選択
3. ✅ 警告メッセージ表示: "Phase 6.2で実装予定"
4. ✅ Claude選択状態になる（実際の機能はPhase 6.2で実装）

### 4. LocalStorage永続化テスト

1. APIキーを登録
2. AIモデルをClaudeに変更
3. ブラウザをリロード
4. ✅ APIキーが復元される
5. ✅ Claude選択状態が復元される

### 5. 表示/非表示トグルテスト

1. モーダルでAPIキーを入力
2. デフォルトで `*****` 形式で非表示
3. 目アイコンをクリック
4. ✅ APIキーがプレーンテキストで表示される
5. もう一度目アイコンをクリック
6. ✅ 再度非表示になる

---

## 🐛 既知の制限事項

### Phase 6.1での制限

1. **Claude API実装未完了**
   - Claude APIキーを登録できるが、実際の通信機能はPhase 6.2で実装予定
   - Claude選択時は警告メッセージが表示される

2. **APIキー検証の制限**
   - 現在は形式チェックのみ
   - 実際のAPI呼び出しによる検証はPhase 6.2で実装予定

3. **セキュリティ**
   - 簡易的な暗号化のみ
   - より強固なセキュリティはサーバーサイド実装で対応予定

---

## 📁 ファイル一覧

### 新規作成
```
lib/
├── utils/
│   ├── encryption.ts          # 暗号化/復号化ユーティリティ
│   └── storage.ts             # LocalStorageヘルパー
└── ai/
    └── claude.ts              # Claude API統合（Phase 6.2で完全実装）

components/
├── settings/
│   └── APIKeyModal.tsx        # APIキー設定モーダル
└── layout/
    └── StorageInitializer.tsx # LocalStorage初期化
```

### 更新
```
lib/store/useStore.ts           # Zustandストア拡張
components/layout/Header.tsx    # 設定ボタン追加
components/chat/AISelector.tsx  # Claude選択時の動作追加
app/page.tsx                    # StorageInitializer統合
```

### ドキュメント
```
docs/PHASE6_1_IMPLEMENTATION.md # このファイル
```

---

## 🔜 次のステップ: Phase 6.2

Phase 6.2では、実際のClaude API統合を実装します。

### 実装予定内容

1. **Claude API統合**
   - Anthropic Claude API v1の完全実装
   - ストリーミングレスポンス対応
   - エラーハンドリング

2. **APIキー検証の強化**
   - 実際のAPI呼び出しによる検証
   - エラーメッセージの詳細化

3. **チャット機能の拡張**
   - GeminiとClaudeの切り替え対応
   - 会話履歴の共通化
   - しおりデータの統合処理

4. **UI改善**
   - Claude使用時の特別なUI表示
   - APIレート制限の表示
   - 使用量の追跡（オプション）

---

## ✅ チェックリスト

### Phase 6.1実装完了項目

- [x] 暗号化/復号化ユーティリティの実装
- [x] LocalStorageヘルパーの実装
- [x] Zustandストアの拡張（LocalStorage同期、初期化処理）
- [x] APIKeyModalコンポーネントの実装
- [x] Claude APIキー検証機能の実装（形式チェック）
- [x] HeaderにSettings/APIキー設定ボタンを追加
- [x] AISelectorの更新（Claude選択時のAPIキー確認）
- [x] LocalStorage初期化処理の実装
- [x] 実装ドキュメントの作成

### 次のフェーズへの準備

- [ ] Phase 6.2: Claude API完全統合
- [ ] Phase 6.3: AIモデル切り替え機能の完全動作確認

---

## 📝 メモ

- APIキーは暗号化されてLocalStorageに保存されるが、完全なセキュリティは保証されない
- 本番環境では、サーバーサイドでのAPIキー管理を推奨
- Phase 6.2でClaude APIの実装が完了するまで、Claude選択は警告付きで利用可能

---

**実装完了日**: 2025-10-07  
**実装者**: AI Assistant  
**レビューステータス**: 要確認