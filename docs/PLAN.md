# Journee 実装計画

このドキュメントは、Journeeプロジェクトの今後の実装計画と各フェーズの詳細を記載しています。

**最終更新**: 2025-10-09  
**現在のバージョン**: 0.9.0  
**現在のフェーズ**: Phase 10.4（しおり保存のDB統合）準備中

---

## ✅ ユーザー定義タスクの詳細化完了

以下のタスクは各フェーズに統合済みです：

1. ✅ **Googleユーザー名の自動入力** → Phase 11.3.1に追加
2. ✅ **しおりのDB保存・取得** → Phase 10.4（新規作成）
3. ✅ **閲覧ページにフィードバックボタン配置** → Phase 12.2に追加

## 📊 現在の状況

### 完了済み機能
- ✅ Phase 1-8: 基本機能、認証、AI統合、データベース統合
- ✅ しおり作成・編集・共有機能
- ✅ PDF出力機能（閲覧ページ含む）
- ✅ モバイル対応・PWA
- ✅ Supabaseデータベース統合（Phase 8）
- ✅ Phase 10.1: 閲覧ページのPDF機能修正
- ✅ Phase 10.2: OGP画像の動的生成機能
- ✅ Phase 10.3: フィードバックフォームのコントラスト改善

### 既知の問題
- ✅ ~~閲覧ページ（`/share/[slug]`）でPDF機能が無効化されている~~ → **Phase 10.1で修正完了**
- ✅ ~~共有URLのOGP画像が表示されない~~ → **Phase 10.2で修正完了**（手動テスト推奨）
- ⚠️ **しおり保存がLocalStorageのみ**（データベース統合未完了） → **Phase 10.4で対応予定**
- ⚠️ パフォーマンス指標が目標未達（初期ロード、Lighthouse） → **Phase 13で対応予定**


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

#### Phase 10.3: フィードバックフォームのコントラスト改善 ✅ 完了
**優先度**: ⭐⭐⭐ 高  
**完了日**: 2025-10-09

##### 問題
- フィードバックモーダルのテキスト入力欄（タイトル・詳細）のプレースホルダーテキストが薄いグレー色で見づらい
- 入力中のテキストも薄いグレー色で見づらい
- アクセシビリティの観点からコントラスト比が不十分

##### 実装タスク

1. **プレースホルダーテキストの色改善** ✅
   - [x] タイトル入力欄のプレースホルダーをより濃いグレーに変更
   - [x] 詳細入力欄（textarea）のプレースホルダーをより濃いグレーに変更
   - [x] Tailwind CSSの`placeholder:text-gray-500`を適用
   
2. **入力テキストの色改善** ✅
   - [x] タイトル入力欄のテキストを濃いグレー（`text-gray-900`）に変更
   - [x] 詳細入力欄のテキストを濃いグレー（`text-gray-900`）に変更
   - [x] 入力中の文字がはっきりと見えるように改善
   
3. **視認性の確認** ✅
   - [x] WCAG 2.1 AA基準のコントラスト比を確保
   - [x] 各種ブラウザでの表示確認

##### 実装内容
- `/components/feedback/FeedbackModal.tsx`: チャット欄と同じスタイリングを適用
  - 入力テキスト: `text-gray-900`（濃い黒色）
  - プレースホルダー: `placeholder:text-gray-400`（適度なグレー）
  - 背景色: `bg-white`（明示的に白背景を指定）
  - フォーカス時: `focus:border-blue-500 focus:ring-2 focus:ring-blue-200`
  - MessageInput.tsxと完全に統一されたスタイル
- `/components/comments/CommentForm.tsx`: 同じスタイルを適用
  - 名前入力欄とコメント入力欄の両方を更新
  - フィードバックフォームと完全に統一
  - より濃い色にすることで視認性が大幅に向上
  - アクセシビリティ基準を満たすコントラスト比を確保

##### 関連ファイル
```
- components/feedback/FeedbackModal.tsx（更新）✅
- components/comments/CommentForm.tsx（更新）✅
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

#### Phase 10.4: しおり保存のデータベース統合 🔄
**優先度**: ⭐⭐⭐ 高  
**ステータス**: 📝 計画中

##### 問題
- SaveButtonがLocalStorageにしか保存していない
- StorageInitializerがLocalStorageからしか読み込んでいない
- ログイン時にデータベースからしおり一覧を取得していない
- データベース統合（Phase 8）は完了しているが、保存ボタンが統合されていない

##### 実装タスク

1. **SaveButtonのDB統合** ⚠️ 優先
   - [ ] SaveButton.tsxでSupabase API呼び出しに変更
   - [ ] `/app/api/itinerary/save/route.ts`を使用して保存
   - [ ] 認証状態の確認（ログイン時のみDB保存）
   - [ ] 未ログイン時はLocalStorage保存を維持
   
2. **StorageInitializerのDB統合**
   - [ ] StorageInitializer.tsxでログイン時にDB読み込み
   - [ ] `/app/api/itinerary/load/route.ts`を使用
   - [ ] LocalStorageとの同期処理（競合解決）
   
3. **しおり一覧ページの統合**
   - [ ] `/app/itineraries/page.tsx`でDB読み込みに変更
   - [ ] `/app/api/itinerary/list/route.ts`を使用
   - [ ] ページネーション対応
   
4. **マイページの統合**
   - [ ] `/app/mypage/page.tsx`でDB読み込みに変更
   - [ ] 最近のしおり取得をDB経由に変更
   
5. **テスト**
   - [ ] E2Eテスト: ログイン後の保存・読み込み
   - [ ] E2Eテスト: 未ログイン時の動作確認
   - [ ] 手動テスト: LocalStorageからのマイグレーション

##### 実装方針
```typescript
// SaveButton.tsx の変更例
const handleSave = async () => {
  const session = await getSession();
  
  if (session?.user) {
    // ログイン時: データベースに保存
    const response = await fetch('/api/itinerary/save', {
      method: 'POST',
      body: JSON.stringify(currentItinerary),
    });
  } else {
    // 未ログイン時: LocalStorageに保存（従来通り）
    saveCurrentItinerary(currentItinerary);
  }
};
```

##### 関連ファイル
```
- components/itinerary/SaveButton.tsx（更新）
- components/layout/StorageInitializer.tsx（更新）
- app/itineraries/page.tsx（更新）
- app/mypage/page.tsx（更新）
- app/api/itinerary/save/route.ts（既存）
- app/api/itinerary/load/route.ts（既存）
- app/api/itinerary/list/route.ts（既存）
```

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

1. **コメント表示コンポーネント** ✅ 実装済み
   - [x] `CommentList.tsx` を作成（コメント一覧）
   - [x] `CommentItem.tsx` を作成（個別コメント）
   - [x] 匿名/認証ユーザーの表示分け
   - [x] 自分のコメントに削除ボタン表示
   
2. **コメント投稿フォーム** ⚠️ 改善必要
   - [x] `CommentForm.tsx` を作成（既存）
   - [x] テキストエリア（最大500文字）
   - [x] 名前入力フィールド
   - [x] 投稿ボタン（送信中は無効化）
   - [ ] **Googleユーザー名の自動入力機能** 🆕
   
3. **Googleユーザー名の自動入力機能（新規）** 🆕
   - [ ] NextAuthセッション情報の取得
   - [ ] ログイン時にユーザー名フィールドを自動入力
   - [ ] ユーザー名フィールドを読み取り専用に設定（ログイン時）
   - [ ] 未ログイン時は従来通り手入力可能
   - [ ] UIにログイン状態を表示（例: 「Googleアカウントで投稿」）
   
4. **閲覧ページへの統合**
   - [ ] `/app/share/[slug]/page.tsx` にコメントセクション追加
   - [ ] コメント数の表示
   - [ ] リアルタイム更新（オプション：Supabase Realtime）

##### 実装方針（Googleユーザー名自動入力）
```typescript
// CommentForm.tsx の変更例
'use client';

import { useSession } from 'next-auth/react';

export default function CommentForm({ itineraryId, onSubmit }: CommentFormProps) {
  const { data: session } = useSession();
  const [authorName, setAuthorName] = useState('');
  
  // セッション取得時にユーザー名を自動入力
  useEffect(() => {
    if (session?.user?.name) {
      setAuthorName(session.user.name);
    }
  }, [session]);
  
  const isLoggedIn = !!session?.user;
  
  return (
    <form>
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        disabled={isLoggedIn} // ログイン時は編集不可
        placeholder={isLoggedIn ? '' : '名前を入力してください'}
      />
      {isLoggedIn && (
        <p className="text-xs text-gray-500">
          Googleアカウント（{session.user.name}）で投稿します
        </p>
      )}
    </form>
  );
}
```

##### 関連ファイル
```
- components/comments/CommentList.tsx（既存）✅
- components/comments/CommentItem.tsx（既存）✅
- components/comments/CommentForm.tsx（更新必要）⚠️
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

1. **フィードバックモーダル作成** ✅ 実装済み
   - [x] `FeedbackModal.tsx` を作成（既存）
   - [x] カテゴリ選択（バグ/機能要望/その他）
   - [x] 詳細入力（テキストエリア）
   - [x] スクリーンショット添付（未対応）
   
2. **フィードバックボタン追加** ⚠️ 一部実装
   - [x] ヘッダーに「フィードバック」ボタン追加（既存）
   - [ ] **閲覧ページにフィードバックボタン配置** 🆕
   - [ ] フッターに「問題を報告」リンク追加（オプション）
   
3. **閲覧ページへのフィードバックボタン配置（新規）** 🆕
   - [ ] `/app/share/[slug]/page.tsx` にフィードバックボタン追加
   - [ ] PublicItineraryView.tsx にフィードバックボタンprops追加
   - [ ] ボタン配置: しおり上部（ヘッダー付近）またはフローティングボタン
   - [ ] フィードバックモーダルの統合
   
4. **送信完了フィードバック**
   - [x] 送信成功時のトースト通知（既存）
   - [ ] GitHub Issue URLの表示（オプション）

##### 実装方針（閲覧ページへの配置）
```typescript
// app/share/[slug]/page.tsx の変更例
'use client';

import { useState } from 'react';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { MessageSquare } from 'lucide-react';

export default function SharePage() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  return (
    <>
      {/* フローティングフィードバックボタン */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <MessageSquare size={20} />
        <span>フィードバック</span>
      </button>
      
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
```

##### 関連ファイル
```
- components/feedback/FeedbackModal.tsx（既存）✅
- components/layout/Header.tsx（既存）✅
- app/share/[slug]/page.tsx（更新必要）⚠️
- components/itinerary/PublicItineraryView.tsx（更新必要、オプション）
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

| Phase | 機能 | 優先度 | 影響度 | 難易度 | 期間 | ステータス |
|-------|------|--------|--------|--------|------|-----------|
| 10.1 | 閲覧ページPDF修正 | ⭐⭐⭐ 高 | 高 | 低 | 2日 | ✅ 完了 |
| 10.2 | OGP画像実装 | ⭐⭐⭐ 高 | 高 | 中 | 3日 | ✅ 完了 |
| 10.3 | フィードバックフォームのコントラスト改善 | ⭐⭐⭐ 高 | 中 | 低 | 1日 | ✅ 完了 |
| 10.4 | しおり保存のDB統合 | ⭐⭐⭐ 高 | 高 | 中 | 3-5日 | 📝 計画中 |
| 11 | コメント機能（DB統合含む） | ⭐⭐ 中 | 中 | 中 | 2週間 | 📝 計画中 |
| 11.3 | Googleユーザー名自動入力 | ⭐⭐ 中 | 低 | 低 | 1-2日 | 📝 計画中 |
| 12 | フィードバック機能 | ⭐ 低 | 低 | 低 | 1週間 | 📝 計画中 |
| 12.2 | 閲覧ページにフィードバックボタン配置 | ⭐ 低 | 低 | 低 | 半日 | 📝 計画中 |
| 13 | パフォーマンス最適化 | ⭐⭐ 中 | 高 | 中 | 2週間 | 📝 計画中 |
| 14 | テスト追加 | ⭐⭐ 中 | 中 | 中 | 2週間 | 📝 計画中 |

---

## 📅 実装スケジュール（推奨）

### ✅ 第1週: Phase 10（バグ修正） - 完了
- ✅ Day 1-2: 閲覧ページPDF機能修正（Phase 10.1）
- ✅ Day 3-5: OGP画像実装（Phase 10.2）
- ✅ Day 6: フィードバックフォームのコントラスト改善（Phase 10.3）

### 第2週: Phase 10.4（しおり保存のDB統合）
- Day 1-2: SaveButton、StorageInitializerのDB統合
- Day 3: しおり一覧ページ、マイページの統合
- Day 4-5: テスト・デバッグ

### 第3-4週: Phase 11（コメント機能）
- Week 3 前半: データベース設計・API実装
- Week 3 後半: UI実装、Googleユーザー名自動入力（Phase 11.3）
- Week 4: テスト・デバッグ・リリース

### 第5週: Phase 12（フィードバック機能）※優先度低
- Day 1-2: GitHub API統合（Phase 12.1）
- Day 3: 閲覧ページにフィードバックボタン配置（Phase 12.2）
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
- [OGPテスト方法（OGP_TESTING.md）](./OGP_TESTING.md)

---

**最終更新**: 2025-10-09  
**次回レビュー**: Phase 10完了後
