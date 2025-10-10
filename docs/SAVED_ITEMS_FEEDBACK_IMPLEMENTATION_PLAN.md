# 実装計画: 保存済み表示の改善

**作成日**: 2025-10-10  
**対応Issue**: [機能要望] 保存済み表示がわかりづらい  
**フィードバック送信者**: Aoba Iwaki

---

## 📋 問題の概要

### ユーザーからのフィードバック

> 保存済み表示はlocalStorageに保存されるだけでDBに保存されないので、ユーザーが混乱します  
> DBにも保存するか、UIを削除するかどっちかにしてください

### 現状の問題点

1. **保存状態の曖昧さ**
   - `SaveStatus.tsx` が「保存済み」と表示するが、LocalStorageへの保存のみを示している
   - ログインユーザーにとって、データがDBに保存されているか不明確
   - `AutoSave.tsx` が2秒ごとにLocalStorageへ自動保存しているが、DBには保存されない

2. **ユーザー体験の問題**
   - LocalStorageは一時的（ブラウザデータ削除で消失）
   - ログインユーザーはDB保存を期待するが、明示されていない
   - 未ログインユーザーはデータの永続性がないことを認識していない可能性

3. **実装の不整合**
   - `SaveButton` クリック時のみDB保存が実行される
   - 自動保存はLocalStorageのみに限定されている
   - 保存ボタンのラベルが保存先を明示していない

### 影響を受けるコンポーネント

| ファイル | 現在の動作 | 問題点 |
|---------|-----------|--------|
| `components/layout/AutoSave.tsx` | LocalStorageに自動保存（2秒デバウンス + 5分定期） | DB保存なし |
| `components/ui/SaveStatus.tsx` | 「保存済み」と表示 | 保存先が不明確 |
| `components/itinerary/SaveButton.tsx` | ログイン時: DB保存<br>未ログイン時: LocalStorage保存 | ラベルが保存先を明示していない |
| `lib/store/useStore.ts` | しおり更新時にLocalStorageへ自動保存 | DB保存なし |

---

## 💡 推奨ソリューション: DB自動保存 + UI改善

**基本方針**: LocalStorageを削除せず、DB保存を強化し、UIで明確に区別する

### 利点
- ✅ 未ログインユーザーも引き続き利用可能
- ✅ オフライン編集機能を維持
- ✅ ログインユーザーは自動的にDBへ保存される
- ✅ 保存先が明確に表示される

### 欠点
- ⚠️ 実装が若干複雑になる
- ⚠️ DB保存のAPI呼び出しが増加（デバウンスで軽減）

---

## 🚀 実装フェーズ

### Phase 1: DB自動保存の実装 🔧

**目的**: ログインユーザーのしおりをDBに自動保存

#### 実装内容

1. **AutoSaveコンポーネントの拡張**
   
   **ファイル**: `components/layout/AutoSave.tsx`
   
   **変更点**:
   - `useSession()` フックを使用してログイン状態を検知
   - ログイン時: DB + LocalStorage両方に保存
   - 未ログイン時: LocalStorageのみ保存（従来通り）
   - エラーハンドリングの強化（DB保存失敗時の対応）

   **デバウンス時間**:
   - DB保存: **5秒デバウンス**（API負荷軽減）
   - LocalStorage保存: **2秒デバウンス**（高速応答維持）

   **擬似コード**:
   ```typescript
   const performSave = async (itinerary) => {
     if (!itinerary) return;
     
     setSaving(true);
     
     try {
       // LocalStorageへ保存（常に実行）
       saveCurrentItinerary(itinerary);
       setLastLocalSaveTime(new Date());
       
       // ログイン時: DBへも保存
       if (session?.user) {
         await fetch('/api/itinerary/save', {
           method: 'POST',
           body: JSON.stringify({ 
             itinerary,
             saveMode: 'overwrite'
           })
         });
         setLastDbSaveTime(new Date());
         setSaveLocation('database');
       } else {
         setSaveLocation('localStorage');
       }
     } catch (error) {
       console.error('Save failed:', error);
       // エラー通知表示
     } finally {
       setSaving(false);
     }
   };
   ```

2. **Zustandストアの拡張**
   
   **ファイル**: `lib/store/useStore.ts`
   
   **追加状態**:
   ```typescript
   interface AppState {
     // 既存の状態...
     
     // 新規追加
     saveLocation: 'database' | 'localStorage' | 'none';
     lastDbSaveTime: Date | null;
     lastLocalSaveTime: Date | null;
     setSaveLocation: (location: 'database' | 'localStorage' | 'none') => void;
     setLastDbSaveTime: (time: Date | null) => void;
     setLastLocalSaveTime: (time: Date | null) => void;
   }
   ```

#### テスト項目

- [ ] ログインユーザー: 自動保存がDBに反映される
- [ ] 未ログインユーザー: LocalStorageのみに保存される
- [ ] DB保存失敗時: LocalStorage保存は継続される
- [ ] デバウンス機能: 連続編集時に過剰なAPI呼び出しがない

---

### Phase 2: 保存状態UIの改善 🎨

**目的**: 保存先を明確に表示し、ユーザーの不安を解消

#### 2.1 SaveStatus コンポーネントの改善

**ファイル**: `components/ui/SaveStatus.tsx`

**変更点**:
- 保存先（DB or LocalStorage）を明示
- ログイン促進メッセージの追加（未ログイン時）
- アイコンと色の最適化

**表示パターン**:

| 状態 | ログイン時 | 未ログイン時 |
|------|-----------|-------------|
| **保存中** | 🔄 データベースに保存中... | 🔄 ブラウザに保存中... |
| **保存済み** | ✅ データベースに保存済み (3分前) | ⚠️ ブラウザに一時保存 (3分前)<br>💡 ログインして永久保存 |
| **未保存** | ⚠️ 未保存の変更があります | ⚠️ 未保存の変更があります |

**擬似コード**:
```tsx
export const SaveStatus: React.FC = () => {
  const { data: session } = useSession();
  const isSaving = useStore((state) => state.isSaving);
  const saveLocation = useStore((state) => state.saveLocation);
  const lastDbSaveTime = useStore((state) => state.lastDbSaveTime);
  const lastLocalSaveTime = useStore((state) => state.lastLocalSaveTime);
  
  const isLoggedIn = !!session?.user;
  const lastSaveTime = isLoggedIn ? lastDbSaveTime : lastLocalSaveTime;
  
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="animate-spin text-blue-500" size={16} />
        <span>
          {isLoggedIn 
            ? 'データベースに保存中...' 
            : 'ブラウザに保存中...'}
        </span>
      </div>
    );
  }
  
  if (lastSaveTime && saveLocation === 'database') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Check className="text-green-500" size={16} />
        <span className="text-gray-600">
          データベースに保存済み ({formatTimeAgo(lastSaveTime)})
        </span>
      </div>
    );
  }
  
  if (lastSaveTime && saveLocation === 'localStorage') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="text-yellow-500" size={16} />
          <span className="text-gray-600">
            ブラウザに一時保存 ({formatTimeAgo(lastSaveTime)})
          </span>
        </div>
        <Link 
          href="/login" 
          className="text-xs text-blue-500 hover:underline ml-5"
        >
          💡 ログインして永久保存
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <AlertCircle className="text-gray-400" size={16} />
      <span className="text-gray-400">未保存の変更があります</span>
    </div>
  );
};
```

#### 2.2 SaveButton ラベルの改善

**ファイル**: `components/itinerary/SaveButton.tsx`

**変更点**:
- ボタンラベルを保存先に応じて変更
- ツールチップで保存先を明示

**表示パターン**:

| ボタン | ログイン時 | 未ログイン時 |
|--------|-----------|-------------|
| **上書き保存** | 📝 DBに保存 | 💾 一時保存 |
| **新規保存** | ➕ 別のしおりとして保存 | ➕ 別のしおりとして保存 |

**擬似コード**:
```tsx
export const SaveButton: React.FC = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  
  return (
    <div className="flex items-center gap-2">
      {/* 上書き保存ボタン */}
      <button
        onClick={() => handleSave('overwrite')}
        disabled={isSaving}
        className="..."
        title={isLoggedIn 
          ? 'データベースに上書き保存します' 
          : 'ブラウザに一時保存します（ログインすると永久保存できます）'}
      >
        <Save size={20} />
        <span>
          {isSaving 
            ? '保存中...' 
            : isLoggedIn 
              ? 'DBに保存' 
              : '一時保存'}
        </span>
      </button>
      
      {/* 新規保存ボタン */}
      <button
        onClick={() => handleSave('new')}
        disabled={isSaving}
        className="..."
      >
        <FilePlus size={20} />
        <span>{isSaving ? '保存中...' : '新規保存'}</span>
      </button>
      
      {/* 未ログイン時のみ: ログイン促進リンク */}
      {!isLoggedIn && (
        <Link 
          href="/login" 
          className="text-xs text-blue-500 hover:underline"
        >
          ログインして永久保存
        </Link>
      )}
    </div>
  );
};
```

---

### Phase 3: ログイン促進バナーの追加 🔐

**目的**: 未ログインユーザーにログインのメリットを伝える

#### 実装内容

**新規ファイル**: `components/ui/LoginPromptBanner.tsx`

**表示条件**:
- 未ログインユーザーがしおりを編集中
- しおりに内容が含まれている（空ではない）
- バナーを閉じた後、同一セッション中は非表示（LocalStorageで記録）

**デザイン**:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ 現在ブラウザに一時保存されています                        │
│                                                               │
│ ブラウザデータを削除すると、しおりが失われます。              │
│ データを永久保存するにはログインしてください。                │
│                                                               │
│ [ログインして永久保存]  [後で]                                │
└─────────────────────────────────────────────────────────────┘
```

**擬似コード**:
```tsx
export const LoginPromptBanner: React.FC = () => {
  const { data: session } = useSession();
  const currentItinerary = useStore((state) => state.currentItinerary);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    const dismissed = localStorage.getItem('login_prompt_dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);
  
  const handleDismiss = () => {
    localStorage.setItem('login_prompt_dismissed', 'true');
    setIsDismissed(true);
  };
  
  // ログイン済み、またはしおりが空、またはバナーが閉じられた場合は非表示
  if (session?.user || !currentItinerary || isDismissed) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            現在ブラウザに一時保存されています
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            ブラウザデータを削除すると、しおりが失われます。<br />
            データを永久保存するにはログインしてください。
          </p>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ログインして永久保存
            </Link>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              後で
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
```

**配置場所**:
- `app/page.tsx` のしおりプレビュー上部
- または `components/itinerary/ItineraryPreview.tsx` の先頭

---

### Phase 4: 型定義の整備 📊

#### 新規ファイル: `types/save.ts`

**型定義**:
```typescript
/**
 * 保存先の種類
 */
export type SaveLocation = 
  | 'database'      // データベースに保存済み
  | 'localStorage'  // LocalStorageに保存済み
  | 'both'          // 両方に保存済み
  | 'none';         // 未保存

/**
 * 保存状態
 */
export interface SaveStatus {
  /** 保存先 */
  location: SaveLocation;
  
  /** 最後にDBに保存した時刻 */
  lastDbSaveTime: Date | null;
  
  /** 最後にLocalStorageに保存した時刻 */
  lastLocalSaveTime: Date | null;
  
  /** 現在保存処理中か */
  isSaving: boolean;
  
  /** 保存エラーメッセージ */
  saveError: string | null;
}

/**
 * 保存モード
 */
export type SaveMode = 
  | 'overwrite'  // 上書き保存
  | 'new';       // 新規保存

/**
 * 保存結果
 */
export interface SaveResult {
  success: boolean;
  location: SaveLocation;
  message?: string;
  error?: string;
}
```

---

## 📁 実装ファイル一覧

### 変更が必要なファイル

| ファイル | 優先度 | 作業内容 |
|---------|--------|---------|
| `components/layout/AutoSave.tsx` | 🔴 高 | DB自動保存の追加 |
| `components/ui/SaveStatus.tsx` | 🔴 高 | 保存先表示の改善 |
| `components/itinerary/SaveButton.tsx` | 🔴 高 | ラベルとツールチップの改善 |
| `lib/store/useStore.ts` | 🔴 高 | 保存状態管理の拡張 |
| `app/page.tsx` | 🟡 中 | LoginPromptBanner の配置 |

### 新規作成ファイル

| ファイル | 優先度 | 作業内容 |
|---------|--------|---------|
| `components/ui/LoginPromptBanner.tsx` | 🟡 中 | ログイン促進バナーの作成 |
| `types/save.ts` | 🟢 低 | 保存関連の型定義 |

---

## 🧪 テスト計画

### 単体テスト

- [ ] `AutoSave.tsx`: DB保存とLocalStorage保存の動作確認
- [ ] `SaveStatus.tsx`: 各保存状態の表示確認
- [ ] `SaveButton.tsx`: ログイン/未ログイン時のラベル表示確認

### 統合テスト

- [ ] ログインユーザー: 自動保存がDBに反映される
- [ ] 未ログインユーザー: LocalStorageのみに保存される
- [ ] ログイン後: LocalStorageのデータがDBに移行される（マイグレーション）
- [ ] DB保存失敗時: LocalStorage保存は継続される

### E2Eテスト（Playwright）

```typescript
// e2e/save-feedback.spec.ts
test('ログインユーザーはDBに自動保存される', async ({ page }) => {
  // ログイン
  await page.goto('/login');
  await loginAsUser(page);
  
  // しおり作成
  await page.goto('/');
  await page.fill('[data-testid="chat-input"]', '東京旅行を3日間で計画して');
  await page.click('[data-testid="send-button"]');
  
  // しおりが生成されるまで待機
  await page.waitForSelector('[data-testid="itinerary-preview"]');
  
  // 5秒待機（自動保存デバウンス）
  await page.waitForTimeout(6000);
  
  // 保存状態を確認
  const saveStatus = await page.textContent('[data-testid="save-status"]');
  expect(saveStatus).toContain('データベースに保存済み');
});

test('未ログインユーザーはLocalStorageに保存される', async ({ page }) => {
  await page.goto('/');
  
  // しおり作成
  await page.fill('[data-testid="chat-input"]', '大阪旅行を計画して');
  await page.click('[data-testid="send-button"]');
  
  // しおりが生成されるまで待機
  await page.waitForSelector('[data-testid="itinerary-preview"]');
  
  // 2秒待機（自動保存デバウンス）
  await page.waitForTimeout(3000);
  
  // 保存状態を確認
  const saveStatus = await page.textContent('[data-testid="save-status"]');
  expect(saveStatus).toContain('ブラウザに一時保存');
  
  // ログイン促進バナーを確認
  const banner = await page.textContent('[data-testid="login-prompt-banner"]');
  expect(banner).toContain('ログインして永久保存');
});
```

---

## 🎯 期待される効果

### ユーザー体験の改善

| 改善項目 | 現状 | 改善後 |
|---------|------|--------|
| **保存先の明確化** | ❌ 不明確 | ✅ DB or LocalStorageを明示 |
| **ログインユーザー** | ⚠️ 手動保存のみDB | ✅ 自動的にDBに保存 |
| **未ログインユーザー** | ⚠️ データ消失リスク不明 | ✅ 一時保存であることを明示 |
| **ログイン促進** | ❌ なし | ✅ バナーとリンクで促進 |

### 技術的メリット

- ✅ データロスのリスク軽減
- ✅ ユーザーデータの永続化
- ✅ オフライン編集との互換性維持
- ✅ 保存状態の一元管理

### ビジネスインパクト

- 📈 ユーザー登録率の向上（ログイン促進バナー）
- 📈 ユーザー満足度の向上（データ永続化）
- 📉 サポート問い合わせの削減（混乱の解消）

---

## ⚠️ 代替案: LocalStorage保存の完全削除

### 概要

保存機能をDB保存のみに統一し、LocalStorageへの保存を完全に削除する。

### 実装内容

1. **AutoSave.tsx の削除またはDB保存のみに変更**
2. **未ログイン時は保存機能を無効化**
3. **ログインページへのリダイレクト**

### メリット

- ✅ 実装がシンプル
- ✅ ユーザーの混乱を完全排除
- ✅ DB保存のみに集中できる
- ✅ セキュリティリスクの軽減（LocalStorageにデータ保存なし）

### デメリット

- ❌ 未ログインユーザーは利用不可
- ❌ オフライン編集不可
- ❌ 新規ユーザーの体験機会喪失
- ❌ ログイン前の「お試し利用」ができない

### 推奨度: ⚠️ 非推奨

**理由**:
- プロダクトの成長期において、新規ユーザーの体験機会を削るのは避けるべき
- オフライン編集やお試し利用はUXとして重要
- 推奨ソリューション（DB自動保存 + UI改善）で同様の効果を得られる

---

## 📝 実装優先度

### 🔴 Phase 1（必須・最優先）

**目的**: ユーザーフィードバックの主要問題を解決

1. `components/layout/AutoSave.tsx` - DB自動保存の追加
2. `components/ui/SaveStatus.tsx` - 保存先表示の改善
3. `lib/store/useStore.ts` - 保存状態管理の拡張

**期限**: 1週間以内

### 🟡 Phase 2（推奨）

**目的**: ユーザー体験のさらなる向上

1. `components/itinerary/SaveButton.tsx` - ラベル改善
2. `components/ui/LoginPromptBanner.tsx` - ログイン促進バナー

**期限**: 2週間以内

### 🟢 Phase 3（任意）

**目的**: コードの保守性向上

1. `types/save.ts` - 型定義の整備
2. E2Eテストの追加

**期限**: 1ヶ月以内

---

## 🚦 次のステップ

1. **この実装計画のレビュー**
   - プロダクトオーナー、開発チームでレビュー
   - Phase 1-3の優先度を最終決定

2. **Phase 1の実装開始**
   - `AutoSave.tsx` のDB保存対応
   - `SaveStatus.tsx` の表示改善
   - Zustandストアの拡張

3. **テストとQA**
   - 単体テスト、統合テストの実施
   - ステージング環境でのQA

4. **本番デプロイ**
   - フィーチャーフラグでロールアウト（オプション）
   - モニタリングとエラー追跡

5. **ユーザーフィードバックの収集**
   - 改善後のユーザー反応を確認
   - 追加改善の検討

---

## 📞 問い合わせ

実装に関する質問や提案は以下まで：

- **担当者**: Cursor Agent
- **Issue**: [機能要望] 保存済み表示がわかりづらい
- **日付**: 2025-10-10
