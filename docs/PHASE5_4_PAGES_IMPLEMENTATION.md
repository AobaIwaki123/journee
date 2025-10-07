# Phase 5.4: マイページ・栞一覧・設定ページ実装計画

**作成日**: 2025-10-07  
**ステータス**: 📋 計画中  
**前提条件**: Phase 1, 2, 3 完了

---

## 📋 概要

このPhaseでは、ユーザー体験を向上させる以下の3つの主要ページを実装します：

1. **マイページ** - ユーザー情報とアカウント管理
2. **栞一覧ページ** - 作成したしおりの一覧表示（モックデータ使用）
3. **設定ページ** - アプリケーション設定の管理

これらのページは、現在のメインページ（チャット + しおりプレビュー）とは独立したルートとして実装し、ヘッダーナビゲーションからアクセス可能にします。

---

## 🎯 目標

### ビジネス目標
- ユーザーが自分の作成したしおりを管理できる
- ユーザー情報とアカウント設定を一元管理
- アプリケーション全体の設定を柔軟にカスタマイズ可能

### 技術目標
- 再利用可能なコンポーネント設計
- モックデータを使用した段階的実装（Phase 8のDB統合前）
- レスポンシブ対応
- 型安全な実装（TypeScript）

---

## 🏗️ アーキテクチャ

### ディレクトリ構造
```
journee/
├── app/
│   ├── mypage/
│   │   └── page.tsx              # マイページ（ユーザー情報・統計）
│   ├── itineraries/
│   │   └── page.tsx              # 栞一覧ページ
│   └── settings/
│       └── page.tsx              # 設定ページ
├── components/
│   ├── mypage/
│   │   ├── UserProfile.tsx       # ユーザープロフィール表示
│   │   ├── UserStats.tsx         # ユーザー統計（しおり数、訪問国数等）
│   │   └── QuickActions.tsx     # クイックアクション（新規作成等）
│   ├── itineraries/
│   │   ├── ItineraryList.tsx    # しおり一覧コンポーネント
│   │   ├── ItineraryCard.tsx    # しおりカード（サムネイル表示）
│   │   ├── ItineraryFilters.tsx # フィルター（ステータス、日付等）
│   │   └── ItinerarySortMenu.tsx # ソート機能
│   └── settings/
│       ├── GeneralSettings.tsx  # 一般設定
│       ├── AISettings.tsx       # AI設定（モデル選択、APIキー）
│       ├── SoundSettings.tsx    # 効果音設定（Phase 3.6連携）
│       └── AccountSettings.tsx  # アカウント設定
├── lib/
│   └── mock-data/
│       └── itineraries.ts       # モックデータ（しおり一覧用）
└── types/
    └── user.ts                   # ユーザー関連の型定義拡張
```

---

## 📐 実装計画

## 1. マイページ（`/mypage`）

### 1.1 目的
ユーザーの基本情報、統計、アクティビティを一覧表示するダッシュボード

### 1.2 主要機能

#### 1.2.1 ユーザープロフィール表示
- [ ] `UserProfile.tsx` コンポーネントの作成
  - [ ] プロフィール画像（Google OAuth連携）
  - [ ] ユーザー名
  - [ ] メールアドレス
  - [ ] 登録日
  - [ ] 「プロフィール編集」ボタン（将来対応）
- [ ] レスポンシブレイアウト対応
- [ ] スタイリング（Tailwind CSS）

#### 1.2.2 ユーザー統計
- [ ] `UserStats.tsx` コンポーネントの作成
  - [ ] 作成したしおりの総数
  - [ ] 訪問予定の国・都市数
  - [ ] 総旅行日数
  - [ ] 最近のアクティビティ
  - [ ] グラフ表示（Chart.jsまたはRecharts）
    - [ ] 月別しおり作成数
    - [ ] 訪問国の分布
- [ ] モックデータでの統計計算
- [ ] アニメーション効果（カウントアップ等）

#### 1.2.3 クイックアクション
- [ ] `QuickActions.tsx` コンポーネントの作成
  - [ ] 「新しいしおりを作成」ボタン → メインページへ遷移
  - [ ] 「栞一覧を見る」ボタン → `/itineraries` へ遷移
  - [ ] 「設定」ボタン → `/settings` へ遷移
  - [ ] アイコンとラベル表示
- [ ] ホバー効果・アニメーション

#### 1.2.4 最近のしおり
- [ ] 最近編集したしおりを3-5件表示
- [ ] `ItineraryCard` コンポーネントの再利用
- [ ] 「すべて見る」リンク → `/itineraries` へ

#### 1.2.5 ページレイアウト
- [ ] `app/mypage/page.tsx` の作成
- [ ] 認証チェック（未認証時はログインページへリダイレクト）
- [ ] ヘッダー統合
- [ ] レスポンシブデザイン
  - デスクトップ: 3カラムレイアウト
  - タブレット: 2カラム
  - モバイル: 1カラム

### 1.3 データフロー
```
User Access → Session Check → getCurrentUser()
                                      ↓
                              Mock Data Fetch (LocalStorage)
                                      ↓
                        Render UserProfile, UserStats, QuickActions
                                      ↓
                              Display Recent Itineraries
```

---

## 2. 栞一覧ページ（`/itineraries`）

### 2.1 目的
作成したすべてのしおりを一覧表示し、管理する

### 2.2 主要機能

#### 2.2.1 しおり一覧表示
- [ ] `ItineraryList.tsx` コンポーネントの作成
  - [ ] グリッドレイアウト（レスポンシブ対応）
  - [ ] 無限スクロールまたはページネーション（モックデータ50件想定）
  - [ ] 空状態の表示（しおりが0件の場合）
- [ ] `ItineraryCard.tsx` コンポーネントの作成
  - [ ] サムネイル画像（目的地のデフォルト画像）
  - [ ] タイトル
  - [ ] 目的地・期間
  - [ ] ステータスバッジ（draft/completed/archived）
  - [ ] 作成日・更新日
  - [ ] クイックアクション
    - [ ] 「開く」ボタン → メインページで編集
    - [ ] 「PDF出力」ボタン（将来対応）
    - [ ] 「削除」ボタン（確認ダイアログ付き）
  - [ ] ホバー効果・アニメーション

#### 2.2.2 フィルター機能
- [ ] `ItineraryFilters.tsx` コンポーネントの作成
  - [ ] ステータスフィルター（全て/下書き/完成/アーカイブ）
  - [ ] 期間フィルター（今月/今年/全期間）
  - [ ] 目的地検索（インクリメンタルサーチ）
  - [ ] フィルターリセットボタン
- [ ] フィルター状態の管理（Zustandまたはローカルステート）
- [ ] URLクエリパラメータとの連携（将来対応）

#### 2.2.3 ソート機能
- [ ] `ItinerarySortMenu.tsx` コンポーネントの作成
  - [ ] 更新日順（デフォルト）
  - [ ] 作成日順
  - [ ] タイトル順（アルファベット）
  - [ ] 旅行開始日順
  - [ ] 昇順/降順切り替え
- [ ] ソート状態の管理
- [ ] アニメーション付きソート

#### 2.2.4 モックデータ
- [ ] `lib/mock-data/itineraries.ts` の作成
  - [ ] 10-20件のサンプルしおりデータ
  - [ ] バラエティのある目的地（国内・海外）
  - [ ] 異なるステータス（draft/completed/archived）
  - [ ] 異なる期間（日帰り～1週間以上）
  - [ ] リアルなダミーデータ（Faker.js使用を検討）
- [ ] LocalStorage連携（Phase 8までの一時保存）

#### 2.2.5 ページレイアウト
- [ ] `app/itineraries/page.tsx` の作成
- [ ] 認証チェック
- [ ] ヘッダー統合
- [ ] レスポンシブデザイン
  - デスクトップ: 3-4列グリッド
  - タブレット: 2列グリッド
  - モバイル: 1列リスト

### 2.3 データフロー
```
User Access → Session Check → Fetch Itineraries (Mock/LocalStorage)
                                      ↓
                              Apply Filters & Sort
                                      ↓
                              Render ItineraryList
                                      ↓
                        ItineraryCard (map each itinerary)
                                      ↓
                        User Actions (Open/Delete/Export)
```

---

## 3. 設定ページ（`/settings`）

### 3.1 目的
アプリケーション全体の設定を一元管理

### 3.2 主要機能

#### 3.2.1 一般設定
- [ ] `GeneralSettings.tsx` コンポーネントの作成
  - [ ] 言語設定（将来対応: 日本語/英語）
  - [ ] タイムゾーン設定
  - [ ] 日付フォーマット（YYYY/MM/DD, MM/DD/YYYY等）
  - [ ] 通貨設定（JPY/USD/EUR等）
  - [ ] 設定のリセットボタン
- [ ] 設定の保存（LocalStorage）
- [ ] 変更時の自動保存またはSaveボタン
- [ ] 成功・エラー通知

#### 3.2.2 AI設定
- [ ] `AISettings.tsx` コンポーネントの作成
  - [ ] デフォルトAIモデル選択（Gemini/Claude）
  - [ ] Claude APIキー管理
    - [ ] APIキー入力フィールド（パスワード形式）
    - [ ] 「保存」ボタン
    - [ ] 「検証」ボタン（APIキーの有効性確認）
    - [ ] 「削除」ボタン
  - [ ] プロンプトのカスタマイズ（将来対応）
  - [ ] レスポンス長の設定（将来対応）
- [ ] Phase 6（Claude API統合）との連携
- [ ] 暗号化してLocalStorageに保存

#### 3.2.3 効果音設定
- [ ] `SoundSettings.tsx` コンポーネントの作成（Phase 3.6と連携）
  - [ ] 効果音ON/OFFトグルスイッチ
  - [ ] 音量調整スライダー（0% - 100%）
  - [ ] 効果音プレビューボタン
    - [ ] 各効果音のテスト再生
  - [ ] 効果音別の個別ON/OFF（将来対応）
    - [ ] AI返信音
    - [ ] メッセージ送信音
    - [ ] しおり更新音
    - [ ] エラー音
- [ ] Zustand状態管理との連携
  - [ ] `soundEnabled`, `soundVolume` の読み書き
- [ ] LocalStorageへの永続化

#### 3.2.4 アカウント設定
- [ ] `AccountSettings.tsx` コンポーネントの作成
  - [ ] ユーザー情報表示
    - [ ] プロフィール画像（変更不可、Google OAuth連携）
    - [ ] ユーザー名（表示名変更機能、将来対応）
    - [ ] メールアドレス（変更不可）
  - [ ] アカウント管理
    - [ ] 「ログアウト」ボタン
    - [ ] 「アカウント削除」ボタン（確認ダイアログ、将来対応）
  - [ ] データ管理
    - [ ] 「全データエクスポート」（JSON）（将来対応）
    - [ ] 「全データ削除」（確認ダイアログ、将来対応）
- [ ] Phase 2（認証機能）との連携

#### 3.2.5 ページレイアウト
- [ ] `app/settings/page.tsx` の作成
- [ ] 認証チェック
- [ ] サイドバーナビゲーション（セクション切り替え）
  - [ ] 一般設定
  - [ ] AI設定
  - [ ] 効果音設定
  - [ ] アカウント設定
- [ ] タブ切り替えまたはアコーディオン（モバイル対応）
- [ ] レスポンシブデザイン
  - デスクトップ: サイドバー + コンテンツエリア
  - モバイル: タブまたはアコーディオン

### 3.3 データフロー
```
User Access → Session Check → Load Settings (LocalStorage/Zustand)
                                      ↓
                        Render Settings Components
                                      ↓
                        User Updates Settings
                                      ↓
                        Validate & Save (LocalStorage)
                                      ↓
                        Update Zustand Store
                                      ↓
                        Apply Settings Globally
```

---

## 🗂️ 型定義

### 1. ユーザー統計型（`types/user.ts`）
```typescript
export interface UserStats {
  totalItineraries: number;
  totalCountries: number;
  totalCities: number;
  totalDays: number;
  lastActivity: Date;
  monthlyItineraries: { month: string; count: number }[];
  countryDistribution: { country: string; count: number }[];
}

export interface UserProfile extends User {
  createdAt: Date;
  stats: UserStats;
}
```

### 2. しおり一覧フィルター型（`types/itinerary.ts`）
```typescript
export type ItineraryStatus = 'draft' | 'completed' | 'archived';

export interface ItineraryFilter {
  status: ItineraryStatus | 'all';
  period: 'all' | 'this_month' | 'this_year';
  searchTerm: string;
}

export interface ItinerarySort {
  field: 'updatedAt' | 'createdAt' | 'title' | 'startDate';
  order: 'asc' | 'desc';
}
```

### 3. 設定型（`types/settings.ts`）
```typescript
export interface GeneralSettings {
  language: 'ja' | 'en';
  timezone: string;
  dateFormat: 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  currency: 'JPY' | 'USD' | 'EUR' | 'GBP';
}

export interface AISettings {
  defaultModel: 'gemini' | 'claude';
  claudeApiKey?: string;
  // 将来追加
  // customPrompt?: string;
  // responseLength?: 'short' | 'medium' | 'long';
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
  // 将来追加
  // notificationSound: boolean;
  // sendSound: boolean;
  // updateSound: boolean;
  // errorSound: boolean;
}

export interface AppSettings {
  general: GeneralSettings;
  ai: AISettings;
  sound: SoundSettings;
}
```

---

## 🔧 状態管理（Zustand拡張）

### `lib/store/useStore.ts` への追加
```typescript
interface AppStore {
  // ... existing state ...
  
  // 設定関連
  settings: AppSettings;
  setGeneralSettings: (settings: GeneralSettings) => void;
  setAISettings: (settings: AISettings) => void;
  setSoundSettings: (settings: SoundSettings) => void;
  resetSettings: () => void;
  
  // しおり一覧フィルター
  itineraryFilter: ItineraryFilter;
  setItineraryFilter: (filter: Partial<ItineraryFilter>) => void;
  itinerarySort: ItinerarySort;
  setItinerarySort: (sort: ItinerarySort) => void;
}
```

---

## 📊 モックデータ

### `lib/mock-data/itineraries.ts`
```typescript
import { ItineraryData } from '@/types/itinerary';

export const mockItineraries: ItineraryData[] = [
  {
    id: '1',
    title: '東京3日間の旅',
    destination: '東京, 日本',
    startDate: '2025-11-01',
    endDate: '2025-11-03',
    duration: 3,
    summary: '東京の主要観光地を巡る旅',
    schedule: [/* ... */],
    totalBudget: 50000,
    status: 'draft',
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-05'),
  },
  {
    id: '2',
    title: 'パリ1週間の旅',
    destination: 'パリ, フランス',
    startDate: '2025-12-15',
    endDate: '2025-12-22',
    duration: 7,
    summary: 'パリの美術館とカフェを満喫',
    schedule: [/* ... */],
    totalBudget: 300000,
    status: 'completed',
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-10-01'),
  },
  // ... 10-20件のダミーデータ
];

export const getUserItineraries = (userId: string): ItineraryData[] => {
  // LocalStorageから取得 + モックデータのマージ
  return mockItineraries;
};
```

---

## 🎨 UI/UXデザイン

### デザイン原則
1. **一貫性**: 既存のメインページとの視覚的一貫性
2. **シンプル**: 必要な情報を過不足なく表示
3. **レスポンシブ**: すべてのデバイスで快適に操作可能
4. **フィードバック**: 操作に対する即座のフィードバック
5. **アクセシビリティ**: WCAG 2.1 AA準拠

### カラーパレット
- プライマリ: Tailwind CSS デフォルトの `blue` または `indigo`
- セカンダリ: `gray`
- ステータス色:
  - draft: `yellow`
  - completed: `green`
  - archived: `gray`

### アニメーション
- フェードイン: ページ遷移時
- スライドイン: カード表示時
- ホバー効果: カード、ボタン
- カウントアップ: 統計数値

---

## 🧪 テスト計画

### 1. ユニットテスト
- [ ] `UserProfile` コンポーネント
- [ ] `UserStats` コンポーネント
- [ ] `ItineraryCard` コンポーネント
- [ ] `ItineraryFilters` コンポーネント
- [ ] 設定コンポーネント群
- [ ] フィルター・ソートロジック

### 2. インテグレーションテスト
- [ ] マイページ全体の表示
- [ ] しおり一覧のフィルター・ソート動作
- [ ] 設定の保存・読込

### 3. E2Eテスト（Playwright）
- [ ] マイページへのアクセス → 統計表示確認
- [ ] しおり一覧 → フィルター適用 → カード表示確認
- [ ] 設定ページ → 設定変更 → 保存 → 反映確認

### 4. 手動テスト
- [ ] レスポンシブデザインの確認（デスクトップ、タブレット、モバイル）
- [ ] アニメーション・ホバー効果の確認
- [ ] エラーハンドリングの確認

---

## 📅 実装スケジュール

### Week 1: マイページ実装
- Day 1-2: `UserProfile`, `UserStats` コンポーネント
- Day 3-4: `QuickActions`, レイアウト統合
- Day 5: テスト・デバッグ

### Week 2: 栞一覧ページ実装
- Day 1-2: `ItineraryList`, `ItineraryCard` コンポーネント
- Day 3: `ItineraryFilters`, `ItinerarySortMenu` 実装
- Day 4: モックデータ作成、統合
- Day 5: テスト・デバッグ

### Week 3: 設定ページ実装
- Day 1: `GeneralSettings`, `AISettings` コンポーネント
- Day 2: `SoundSettings`, `AccountSettings` コンポーネント
- Day 3: レイアウト統合、Zustand連携
- Day 4: LocalStorage永続化、検証機能
- Day 5: テスト・デバッグ、統合テスト

### Week 4: 最終調整・ドキュメント
- Day 1-2: レスポンシブ対応の最終調整
- Day 3: アニメーション・UI改善
- Day 4: E2Eテスト、パフォーマンス最適化
- Day 5: ドキュメント作成、レビュー

---

## 🔗 関連Phase

### 依存関係
- **Phase 1**: 基礎構築（レイアウト、状態管理）
- **Phase 2**: 認証機能（ユーザー情報取得）
- **Phase 3**: AI統合（しおりデータ構造）
- **Phase 3.6**: 効果音システム（設定ページで制御）
- **Phase 6**: Claude API統合（設定ページでAPIキー管理）

### 連携Phase
- **Phase 5**: しおり機能統合（しおり一覧から個別しおりを開く）
- **Phase 7**: UI最適化・レスポンシブ対応（モバイル表示）
- **Phase 8**: データベース統合（モックデータ → DB移行）

---

## 🚀 導入後の効果

### ユーザー体験の向上
- ✅ ユーザーが作成したすべてのしおりを一元管理
- ✅ 個人の旅行統計を可視化
- ✅ アプリケーション設定を柔軟にカスタマイズ
- ✅ 直感的なナビゲーションでページ間を移動

### 開発の効率化
- ✅ 再利用可能なコンポーネント設計
- ✅ モックデータでPhase 8（DB統合）前に機能検証
- ✅ 型安全な実装でバグを最小化

---

## 📝 今後の拡張

### Phase 8（データベース統合）後
- [ ] モックデータ → 実際のDB連携
- [ ] しおり一覧のページネーション（サーバーサイド）
- [ ] しおりの検索（全文検索）
- [ ] ユーザー統計のリアルタイム集計

### 将来的な機能追加
- [ ] ユーザープロフィールの編集
- [ ] しおりのテンプレート選択（設定ページ）
- [ ] エクスポート機能（JSON, PDF）
- [ ] アカウント削除機能
- [ ] 多言語対応（設定ページで切り替え）
- [ ] ダークモード（設定ページで切り替え）

---

## ✅ 完了条件

### マイページ
- [ ] ユーザー情報が正しく表示される
- [ ] 統計情報がモックデータから計算される
- [ ] クイックアクションが正しく動作する
- [ ] レスポンシブデザインが適用される

### 栞一覧ページ
- [ ] モックデータが正しく表示される
- [ ] フィルター機能が正常に動作する
- [ ] ソート機能が正常に動作する
- [ ] カードクリックでメインページに遷移する
- [ ] 削除機能が正常に動作する（確認ダイアログ付き）

### 設定ページ
- [ ] 全設定項目が正しく表示される
- [ ] 設定変更がLocalStorageに保存される
- [ ] 設定変更が即座にアプリ全体に反映される
- [ ] APIキーの保存・検証・削除が正常に動作する
- [ ] 効果音設定がPhase 3.6と連携する

### 共通
- [ ] すべてのページが認証チェックを通過する
- [ ] ヘッダーナビゲーションが正しく動作する
- [ ] エラーハンドリングが適切に実装される
- [ ] ユニットテスト・E2Eテストが通過する
- [ ] Lighthouse スコア 90点以上

---

## 📚 参考リンク

- [Next.js App Router ドキュメント](https://nextjs.org/docs/app)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [Zustand ドキュメント](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Hook Form](https://react-hook-form.com/)
- [Zod（バリデーション）](https://zod.dev/)

---

**作成者**: AI Coding Assistant  
**レビュー**: 未実施  
**承認**: 未実施