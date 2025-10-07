# Phase 5.5: しおり公開・共有機能

**実装期間**: Week 14-15  
**依存関係**: Phase 5.1 (しおり表示)、Phase 5.3 (PDF出力)  
**状態**: 📋 未実装

## 概要

作成した旅のしおりを公開URLで共有できる機能を実装します。ユーザーは公開/非公開を切り替え可能で、公開したしおりは誰でも閲覧できるRead-onlyページとして表示されます。

## 目的

- 作成した旅のしおりを家族や友人と簡単に共有
- SNSでの旅行計画の共有
- Read-onlyページでの安全な閲覧体験
- OGP（Open Graph Protocol）対応でリッチプレビュー表示

## 実装内容

### 5.5.1 型定義の拡張

#### `types/itinerary.ts` の更新

```typescript
// 既存のItineraryDataに追加
export interface ItineraryData {
  // ... 既存のプロパティ ...
  
  // 公開設定
  isPublic: boolean;                // 公開/非公開フラグ
  publicSlug?: string;              // 公開URL用のユニークスラッグ
  publishedAt?: Date;               // 公開日時
  viewCount?: number;               // 閲覧数
  allowPdfDownload?: boolean;       // PDF ダウンロード許可フラグ
}

// 公開設定の型
export interface PublicItinerarySettings {
  isPublic: boolean;
  allowPdfDownload: boolean;
  customMessage?: string;           // 閲覧者へのメッセージ（オプション）
}

// 公開しおりのメタデータ
export interface PublicItineraryMetadata {
  slug: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  thumbnailUrl?: string;
  authorName: string;
  viewCount: number;
  publishedAt: Date;
}
```

### 5.5.2 公開URL生成・管理

#### APIエンドポイント: `/api/itinerary/publish`

**POST**: しおりを公開してURLを発行

```typescript
// Request
{
  itineraryId: string;
  settings: PublicItinerarySettings;
}

// Response
{
  success: true;
  publicUrl: string;              // https://journee.app/share/abc123def
  slug: string;                   // abc123def
  publishedAt: Date;
}
```

#### APIエンドポイント: `/api/itinerary/unpublish`

**POST**: しおりを非公開にする

```typescript
// Request
{
  itineraryId: string;
}

// Response
{
  success: true;
  message: "しおりを非公開にしました";
}
```

#### 実装詳細

**ファイル**: `app/api/itinerary/publish/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { itineraryId, settings } = await req.json();

    // しおりの所有権チェック（Phase 8以降）
    // const itinerary = await db.getItinerary(itineraryId, user.id);
    // if (!itinerary) { return 404; }

    // ユニークなスラッグ生成（10文字、URL-safe）
    const slug = nanoid(10);

    // Phase 8以降: データベースに保存
    // await db.updateItinerary(itineraryId, {
    //   isPublic: settings.isPublic,
    //   publicSlug: slug,
    //   publishedAt: new Date(),
    //   allowPdfDownload: settings.allowPdfDownload,
    // });

    // Phase 5-7: LocalStorageでの管理（モック実装）
    // クライアント側で状態を更新

    const publicUrl = `${process.env.NEXTAUTH_URL}/share/${slug}`;

    return NextResponse.json({
      success: true,
      publicUrl,
      slug,
      publishedAt: new Date(),
    });
  } catch (error) {
    console.error('Error publishing itinerary:', error);
    return NextResponse.json(
      { error: '公開に失敗しました' },
      { status: 500 }
    );
  }
}
```

### 5.5.3 閲覧用ページ（Read-only）

#### ページ: `/app/share/[slug]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PublicItineraryView from '@/components/itinerary/PublicItineraryView';

interface PageProps {
  params: { slug: string };
}

// OGP メタデータ生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Phase 8以降: データベースから取得
  // const itinerary = await db.getPublicItinerary(params.slug);
  
  // Phase 5-7: モックデータまたはLocalStorage
  const itinerary = null; // TODO: 実装

  if (!itinerary) {
    return {
      title: 'しおりが見つかりません',
    };
  }

  return {
    title: `${itinerary.title} | Journee`,
    description: `${itinerary.destination}への旅行計画（${itinerary.startDate} - ${itinerary.endDate}）`,
    openGraph: {
      title: itinerary.title,
      description: `${itinerary.destination}への${itinerary.schedule.length}日間の旅行`,
      images: [
        {
          url: itinerary.thumbnailUrl || '/images/default-thumbnail.jpg',
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: itinerary.title,
      description: `${itinerary.destination}への旅行計画`,
    },
  };
}

export default async function PublicItineraryPage({ params }: PageProps) {
  // Phase 8以降: データベースから取得 + 閲覧数カウント
  // const itinerary = await db.getPublicItinerary(params.slug);
  // await db.incrementViewCount(params.slug);

  // Phase 5-7: モックデータ
  const itinerary = null; // TODO: 実装

  if (!itinerary || !itinerary.isPublic) {
    notFound();
  }

  return <PublicItineraryView itinerary={itinerary} />;
}
```

### 5.5.4 UIコンポーネント

#### 1. `PublicItineraryView.tsx` - 閲覧専用ビュー

**ファイル**: `components/itinerary/PublicItineraryView.tsx`

```typescript
'use client';

import React from 'react';
import { ItineraryData } from '@/types/itinerary';
import ItineraryHeader from './ItineraryHeader';
import ItinerarySummary from './ItinerarySummary';
import DaySchedule from './DaySchedule';
import { Download, Share2 } from 'lucide-react';

interface PublicItineraryViewProps {
  itinerary: ItineraryData;
}

export default function PublicItineraryView({ itinerary }: PublicItineraryViewProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: itinerary.title,
        text: `${itinerary.destination}への旅行計画を見てください！`,
        url: window.location.href,
      });
    } else {
      // フォールバック: URLコピー
      await navigator.clipboard.writeText(window.location.href);
      alert('URLをコピーしました');
    }
  };

  const handleDownloadPDF = () => {
    // Phase 5.3のPDF出力機能を呼び出し
    // generatePDF(itinerary);
    console.log('PDF ダウンロード');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Journee</h1>
            <p className="text-sm text-gray-500">共有されたしおり</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Share2 className="w-4 h-4" />
              共有
            </button>
            {itinerary.allowPdfDownload && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* しおり本体 */}
      <div className="max-w-4xl mx-auto p-6">
        {/* カスタムメッセージ */}
        {itinerary.customMessage && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-gray-700">{itinerary.customMessage}</p>
          </div>
        )}

        <ItineraryHeader itinerary={itinerary} isPublic />
        <ItinerarySummary itinerary={itinerary} />
        
        <div className="mt-8 space-y-6">
          {itinerary.schedule.map((day, index) => (
            <DaySchedule
              key={day.date}
              day={day}
              dayIndex={index}
              isPublic // Read-only モード
            />
          ))}
        </div>

        {/* フッター */}
        <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
          <p>
            このしおりは <a href="/" className="text-blue-600 hover:underline">Journee</a> で作成されました
          </p>
          <p className="mt-2">閲覧数: {itinerary.viewCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
```

#### 2. `ShareButton.tsx` - 公開設定ボタン

**ファイル**: `components/itinerary/ShareButton.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { Share2, Link2, Copy, Check } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

export default function ShareButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentItinerary = useStore((state) => state.currentItinerary);
  
  const [settings, setSettings] = useState({
    isPublic: currentItinerary?.isPublic || false,
    allowPdfDownload: currentItinerary?.allowPdfDownload || false,
  });

  const handlePublish = async () => {
    if (!currentItinerary) return;

    try {
      const response = await fetch('/api/itinerary/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId: currentItinerary.id,
          settings,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Zustand storeを更新
        useStore.setState({
          currentItinerary: {
            ...currentItinerary,
            isPublic: true,
            publicSlug: data.slug,
            publishedAt: new Date(data.publishedAt),
            allowPdfDownload: settings.allowPdfDownload,
          },
        });

        alert('しおりを公開しました！');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      alert('公開に失敗しました');
    }
  };

  const copyPublicUrl = async () => {
    if (!currentItinerary?.publicSlug) return;

    const url = `${window.location.origin}/share/${currentItinerary.publicSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Share2 className="w-4 h-4" />
        共有
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border p-4 z-20">
          <h3 className="font-bold text-gray-800 mb-3">しおりを共有</h3>

          {currentItinerary?.isPublic ? (
            <>
              {/* 公開中 */}
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700 font-medium">
                  このしおりは公開されています
                </p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={`${window.location.origin}/share/${currentItinerary.publicSlug}`}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <button
                  onClick={copyPublicUrl}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => {/* unpublish API call */}}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
              >
                公開を停止
              </button>
            </>
          ) : (
            <>
              {/* 非公開 */}
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.isPublic}
                    onChange={(e) => setSettings({ ...settings, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">公開する</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.allowPdfDownload}
                    onChange={(e) => setSettings({ ...settings, allowPdfDownload: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">PDFダウンロードを許可</span>
                </label>
              </div>

              <button
                onClick={handlePublish}
                disabled={!settings.isPublic}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                公開URLを発行
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 3. `DaySchedule.tsx` と `SpotCard.tsx` の更新

Read-only モードをサポートするため、`isPublic` プロパティを追加：

```typescript
// DaySchedule.tsx
interface DayScheduleProps {
  day: DaySchedule;
  dayIndex: number;
  isPublic?: boolean; // 公開ページで表示中の場合はtrue
}

// 編集ボタンを非表示
{!isPublic && (
  <button onClick={handleEdit}>編集</button>
)}
```

### 5.5.5 セキュリティ・プライバシー対策

#### 1. 推測困難なスラッグ生成
- `nanoid` ライブラリを使用（10文字、62文字のアルファベット）
- 衝突確率: 1% 確率で約10億年に1回
- URL例: `/share/V1StGXR8_Z`

#### 2. アクセス制御
- 公開フラグが `true` の場合のみ閲覧可能
- 非公開に変更したら即座にアクセス不可
- スラッグ変更によるURL無効化（再公開時）

#### 3. プライバシー保護
- 作成者のメールアドレスは非表示
- 個人情報は表示しない
- カスタムメッセージで公開範囲を明示可能

#### 4. レート制限
- 公開URL発行: 1日10回まで（悪用防止）
- 閲覧数カウント: IP単位で1日1回のみカウント

#### 5. 不正アクセス対策
- スラッグの総当たり攻撃対策（レート制限）
- 削除されたしおりへのアクセスは404
- 不正なスラッグはエラーログに記録

### 5.5.6 Zustand状態管理の拡張

**ファイル**: `lib/store/slices/itinerarySlice.ts`

```typescript
// アクション追加
publishItinerary: (settings: PublicItinerarySettings) => void;
unpublishItinerary: () => void;
updatePublicSettings: (settings: Partial<PublicItinerarySettings>) => void;
```

### 5.5.7 モックデータでの実装（Phase 5-7）

Phase 8のデータベース統合まではLocalStorageで管理：

**ファイル**: `lib/utils/storage.ts`

```typescript
// 公開しおりをLocalStorageに保存
export const savePublicItinerary = (slug: string, itinerary: ItineraryData) => {
  const publicItineraries = JSON.parse(
    localStorage.getItem('public_itineraries') || '{}'
  );
  publicItineraries[slug] = itinerary;
  localStorage.setItem('public_itineraries', JSON.stringify(publicItineraries));
};

// 公開しおりを取得
export const getPublicItinerary = (slug: string): ItineraryData | null => {
  const publicItineraries = JSON.parse(
    localStorage.getItem('public_itineraries') || '{}'
  );
  return publicItineraries[slug] || null;
};
```

**注意**: LocalStorageは他のユーザーと共有できないため、**Phase 8のデータベース統合が必須**です。Phase 5-7ではUI・フローのみを実装し、実際の共有はPhase 8以降で有効化します。

## 実装順序

1. ✅ **Step 1**: 型定義の拡張（`types/itinerary.ts`）
2. ✅ **Step 2**: APIエンドポイント実装（`/api/itinerary/publish`, `/unpublish`）
3. ✅ **Step 3**: 公開ページの実装（`/app/share/[slug]/page.tsx`）
4. ✅ **Step 4**: UIコンポーネント実装（`ShareButton`, `PublicItineraryView`）
5. ✅ **Step 5**: OGPメタデータ設定（SNS共有対応）
6. ✅ **Step 6**: セキュリティ対策（レート制限、アクセス制御）
7. ✅ **Step 7**: モックデータでのテスト
8. ✅ **Step 8**: Phase 8以降: データベース統合

## 期待される効果

### ✅ ユーザー体験
- 旅のしおりを簡単に家族や友人と共有
- SNSでリッチプレビュー表示（OGP対応）
- URLコピーだけで誰でもアクセス可能
- 編集権限のないRead-only閲覧で安全

### ✅ 機能拡張
- PDF ダウンロード許可の柔軟な設定
- 閲覧数の可視化
- 将来的な「人気のしおり」機能の基盤

### ✅ セキュリティ
- 推測困難なURL（nanoid）
- 公開/非公開の即座切り替え
- 個人情報の保護

## Phase 8以降の拡張（データベース統合後）

### データベーススキーマ追加

```sql
-- itinerariesテーブルに追加
ALTER TABLE itineraries ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE itineraries ADD COLUMN public_slug VARCHAR(50) UNIQUE;
ALTER TABLE itineraries ADD COLUMN published_at TIMESTAMP;
ALTER TABLE itineraries ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE itineraries ADD COLUMN allow_pdf_download BOOLEAN DEFAULT TRUE;
ALTER TABLE itineraries ADD COLUMN custom_message TEXT;

-- 閲覧履歴テーブル（重複カウント防止）
CREATE TABLE itinerary_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(50),
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(itinerary_id, viewer_ip, DATE(viewed_at))
);

-- インデックス
CREATE INDEX idx_itineraries_public_slug ON itineraries(public_slug);
CREATE INDEX idx_itineraries_is_public ON itineraries(is_public);
```

### 将来的な拡張機能

1. **人気のしおり一覧**
   - 閲覧数順でランキング表示
   - カテゴリ別人気しおり

2. **しおりのフォーク（コピー）機能**
   - 他人のしおりを元に自分用にカスタマイズ
   - 「このしおりをコピー」ボタン

3. **コメント機能**
   - 閲覧者がコメントを残せる
   - Q&A形式のやり取り

4. **いいね・ブックマーク機能**
   - 気に入ったしおりを保存
   - 後で参照できる

5. **埋め込み機能**
   - ブログやWebサイトにしおりを埋め込み
   - iframe形式のウィジェット

## テストケース

### 1. 公開URL発行
1. しおりの「共有」ボタンをクリック
2. 「公開する」にチェック
3. 「PDFダウンロードを許可」にチェック
4. 「公開URLを発行」をクリック
5. ✅ 公開URLが表示される（例: `/share/V1StGXR8_Z`）
6. ✅ URLをコピーできる
7. ✅ しおりの状態が「公開中」に変わる

### 2. 公開ページ閲覧
1. 公開URLにアクセス
2. ✅ しおりの内容が表示される
3. ✅ 編集ボタンは表示されない（Read-only）
4. ✅ PDFダウンロードボタンが表示される
5. ✅ 「共有」ボタンで再共有可能
6. ✅ 閲覧数がカウントされる

### 3. 非公開に変更
1. 作成者が「公開を停止」をクリック
2. ✅ しおりが非公開になる
3. ✅ 公開URLにアクセスすると404エラー

### 4. OGPプレビュー
1. 公開URLをSNS（Twitter、Facebook）に投稿
2. ✅ しおりのタイトル、説明、サムネイルが表示される
3. ✅ リッチプレビューが正しく表示される

### 5. セキュリティテスト
1. 非公開のしおりのスラッグに直接アクセス
2. ✅ 404エラーまたは「アクセス権限がありません」
3. ✅ 他人のしおりを編集しようとしても拒否される

## 関連コンポーネント

### 新規作成
- `app/share/[slug]/page.tsx` - 公開閲覧ページ
- `components/itinerary/PublicItineraryView.tsx` - 公開ビューコンポーネント
- `components/itinerary/ShareButton.tsx` - 共有ボタン
- `app/api/itinerary/publish/route.ts` - 公開API
- `app/api/itinerary/unpublish/route.ts` - 非公開API

### 更新
- `types/itinerary.ts` - 型定義追加
- `lib/store/slices/itinerarySlice.ts` - 状態管理拡張
- `components/itinerary/DaySchedule.tsx` - Read-only モード対応
- `components/itinerary/SpotCard.tsx` - Read-only モード対応

## まとめ

**Phase 5.5** では、しおりの公開・共有機能を実装し、以下を実現します：

1. ✅ **公開URL発行**: ユニークなスラッグで推測困難なURL
2. ✅ **Read-only閲覧**: 編集不可の安全な閲覧ページ
3. ✅ **公開設定UI**: 公開/非公開、PDF許可の切り替え
4. ✅ **OGP対応**: SNSでのリッチプレビュー表示
5. ✅ **セキュリティ**: アクセス制御、プライバシー保護、レート制限
6. ✅ **Phase 5.3連携**: PDF ダウンロード機能との統合

**Phase 5-7（モック期間）** ではUI・フローを実装し、**Phase 8以降（DB統合後）** で実際の共有機能を有効化します。

---

**実装優先度**: 高  
**依存関係**:
- Phase 5.1 ✅（しおり表示コンポーネント）
- Phase 5.3 📋（PDF出力機能） - 並行実装可能
- Phase 8 📋（データベース統合） - 完全な共有機能に必須

**次のステップ**: Phase 5.2（一時保存機能）、Phase 5.3（PDF出力機能）と並行して実装可能
