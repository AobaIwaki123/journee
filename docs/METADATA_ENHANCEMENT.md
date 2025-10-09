# OGPメタデータ機能の拡充

## 概要

しおり共有ページ（`/share/[slug]`）のメタデータを拡充し、SNS共有時により豊かな情報を表示できるようにしました。

## 実装内容

### 1. 共有ページ専用レイアウトの作成

**ファイル**: `app/share/[slug]/layout.tsx`

- 共有ページに最適化されたレイアウトを提供
- Viewport設定を追加（モバイルでのズーム可能化など）
- テーマカラーの設定

```typescript
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // ズーム可能にして閲覧性を向上
  themeColor: '#667eea',
};
```

### 2. メタデータの拡充

**ファイル**: `app/share/[slug]/page.tsx`

#### 追加されたメタデータ

1. **robots（検索エンジン制御）**
   - `index: true` - 検索エンジンにインデックス許可
   - `follow: true` - リンクをたどることを許可
   - Google Bot専用の設定も追加

2. **canonical（正規URL）**
   - 重複コンテンツを防ぐため、正規URLを明示

3. **keywords（キーワード）**
   - 目的地、観光スポット名などを自動抽出してSEO強化

4. **Open Graph拡張**
   - `locale: "ja_JP"` - 言語設定を追加

5. **構造化データ（JSON-LD）**
   - Schema.org の `TouristTrip` スキーマを実装
   - 検索エンジンが旅行情報を理解しやすく

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  name: itinerary.title,
  description: itinerary.summary || `${itinerary.destination}への旅行計画`,
  touristType: "leisure",
  itinerary: {
    "@type": "Place",
    name: itinerary.destination,
  },
  startDate: itinerary.schedule[0]?.date,
  endDate: itinerary.schedule[itinerary.schedule.length - 1]?.date,
  url: `${baseUrl}/share/${params.slug}`,
  image: `${baseUrl}/api/og?slug=${params.slug}`,
};
```

### 3. OGP画像生成の改善

**ファイル**: `app/api/og/route.tsx`

- エラー時のフォールバック画像を追加
- エラーが発生しても適切なデフォルト画像を返す

```typescript
// エラー時はデフォルトのOGP画像を返す
return new ImageResponse(
  (
    <div>
      {/* Journeeブランドロゴとメッセージ */}
    </div>
  ),
  { width: 1200, height: 630 }
);
```

## メタデータの種類

### 現在実装済み

- ✅ **タイトル** - しおりタイトル + "Journee"
- ✅ **ディスクリプション** - しおりの概要または自動生成
- ✅ **OGP画像** - 動的に生成される1200x630pxの画像
- ✅ **Twitter Card** - summary_large_image形式
- ✅ **robots** - 検索エンジンへの指示
- ✅ **canonical** - 正規URL
- ✅ **keywords** - SEO用キーワード
- ✅ **構造化データ** - Schema.org TouristTrip

### 将来的な拡張予定

- ⏳ **作成者情報** - `authors` メタデータ（データベースJOIN後）
- ⏳ **多言語対応** - `alternates.languages`
- ⏳ **アプリリンク** - iOS/Android アプリへのディープリンク

## SNS共有時の表示

### Twitter/X
- 大きな画像カード（summary_large_image）
- タイトル、説明、OGP画像が表示される
- @journee_app として表示

### Facebook
- Open Graph準拠の表示
- タイトル、説明、OGP画像、URLが表示される
- サイト名: "Journee"

### LINE
- Open Graphの情報を使用
- タイトル、画像、説明が表示される

### その他のSNS
- 標準的なOpen Graph情報を参照

## テスト方法

### 1. メタデータの確認

ページのHTMLソースを確認：

```html
<!-- robots -->
<meta name="robots" content="index,follow">

<!-- Open Graph -->
<meta property="og:title" content="東京3日間の旅 | Journee">
<meta property="og:description" content="東京の人気スポットを巡る旅">
<meta property="og:image" content="https://journee.aooba.net/api/og?slug=xxx">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">

<!-- 構造化データ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  ...
}
</script>
```

### 2. SNS共有プレビュー確認ツール

- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

### 3. Google検索結果確認

- **Rich Results Test**: https://search.google.com/test/rich-results

## 技術的な詳細

### baseURLの決定ロジック

```typescript
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || 
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
  "http://localhost:3000";
```

優先順位：
1. `NEXT_PUBLIC_BASE_URL` 環境変数
2. Vercel自動設定の `VERCEL_URL`
3. ローカル開発環境（localhost:3000）

### OGP画像のキャッシュ

- Next.js ImageResponseは自動的にキャッシュされる
- Edge Runtimeで高速に画像生成

## 関連ファイル

- `app/share/[slug]/page.tsx` - メタデータ生成ロジック
- `app/share/[slug]/layout.tsx` - 共有ページレイアウト
- `app/api/og/route.tsx` - OGP画像生成API
- `app/layout.tsx` - ルートレイアウト（全体のメタデータ）

## 参考リンク

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org - TouristTrip](https://schema.org/TouristTrip)
