# OGP画像実装計画

## 概要

しおり共有時やJournee全体の共有時に、適切なOGP（Open Graph Protocol）画像が表示されるようにする実装計画。
SNSでシェアした際に、魅力的なプレビュー画像が表示されることで、ユーザーエンゲージメントを向上させる。

## 現在の実装状況

### ✅ 実装済み

1. **しおり共有ページ (`/share/[slug]`)**
   - ファイル: `app/share/[slug]/page.tsx`
   - 状態: 動的OGP画像生成とメタデータ設定が完了
   - 機能:
     - しおりごとに固有のOGP画像を動的生成
     - タイトル、目的地、日数、概要を含む美しいOGP画像
     - Twitter Card対応
     - 構造化データ（JSON-LD）対応

2. **OGP画像生成API (`/api/og`)**
   - ファイル: `app/api/og/route.tsx`
   - 状態: 実装済み
   - 機能:
     - Next.js ImageResponseを使用した動的画像生成
     - しおり情報をベースにした美しいグラデーション画像
     - エラー時のフォールバック画像対応
     - サイズ: 1200x630px（OGP標準）

### ❌ 未実装・問題点

1. **デフォルトOGP画像の不在**
   - `app/layout.tsx`で`/images/og-default.png`を参照しているが、ファイルが存在しない
   - 影響: トップページやOGP未設定ページで画像が表示されない

2. **マイページ (`/mypage`)**
   - ファイル: `app/mypage/page.tsx`
   - 問題: OGPメタデータが設定されていない
   - 影響: マイページをシェアした際にデフォルトOGPのみ表示

3. **しおり一覧ページ (`/itineraries`)**
   - ファイル: `app/itineraries/page.tsx`
   - 問題: クライアントコンポーネントのためメタデータ設定ができない
   - 影響: しおり一覧ページをシェアした際にデフォルトOGPのみ表示

4. **その他の静的ページ**
   - `/privacy`, `/terms`, `/login`, `/settings`
   - 問題: OGPメタデータの設定が不十分または未設定

## 実装計画

### Phase 1: デフォルトOGP画像の動的生成 🎯 優先度: 高

#### 1.1 デフォルトOGP画像生成API

**ファイル:** `app/api/og/default/route.tsx`（新規作成）

**機能:**
- Journeeブランドを表現する美しいデフォルトOGP画像を動的生成
- ロゴ、キャッチコピー、アイコンを含むデザイン
- 既存の`/api/og`のエラー時デザインをベースに改良

**実装内容:**
```typescript
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Journeeブランドデザイン */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '100px', marginBottom: '30px' }}>✈️</span>
          <span
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '4px',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            Journee
          </span>
          <p
            style={{
              fontSize: '36px',
              color: 'rgba(255, 255, 255, 0.95)',
              marginTop: '30px',
              fontWeight: '500',
            }}
          >
            AI旅のしおり作成アプリ
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

#### 1.2 ルートレイアウト更新

**ファイル:** `app/layout.tsx`

**変更内容:**
```typescript
export const metadata: Metadata = {
  // ...
  openGraph: {
    // ...
    images: [
      {
        url: '/api/og/default', // 動的生成APIに変更
        width: 1200,
        height: 630,
        alt: 'Journee - AI旅のしおり作成アプリ',
      },
    ],
  },
  twitter: {
    // ...
    images: ['/api/og/default'], // 動的生成APIに変更
  },
};
```

### Phase 2: 各ページのOGPメタデータ設定 🎯 優先度: 中

#### 2.1 マイページ (`/mypage`)

**ファイル:** `app/mypage/page.tsx`

**実装内容:**
- `generateMetadata`関数を追加
- ユーザー固有の情報を含むOGPメタデータを生成

```typescript
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      title: 'マイページ | Journee',
      description: 'ログインして旅のしおりを管理しましょう。',
    };
  }

  return {
    title: `${user.name}のマイページ | Journee`,
    description: `${user.name}の旅行記録とアクティビティ。作成したしおり、統計情報を確認できます。`,
    openGraph: {
      title: `${user.name}のマイページ | Journee`,
      description: `${user.name}の旅行記録`,
      type: 'profile',
      images: ['/api/og/default'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name}のマイページ | Journee`,
      description: `${user.name}の旅行記録`,
      images: ['/api/og/default'],
    },
  };
}
```

**注意:** 個人情報保護のため、マイページは基本的に共有されることを想定していないが、SEO対策として最低限のメタデータを設定。

#### 2.2 しおり一覧ページ (`/itineraries`)

**問題:** クライアントコンポーネントのため`generateMetadata`が使えない

**解決策:**
1. ページをサーバーコンポーネントに変更し、フィルター・ソート状態をURLパラメータで管理
2. または、`layout.tsx`でメタデータを設定

**推奨:** サーバーコンポーネント化

**ファイル構成変更:**
- `app/itineraries/page.tsx`: サーバーコンポーネント化（メタデータ設定）
- `components/itinerary/ItineraryListClient.tsx`: クライアント側のロジック分離

**実装内容（`app/itineraries/page.tsx`）:**
```typescript
import type { Metadata } from 'next';
import { ItineraryListClient } from '@/components/itinerary/ItineraryListClient';

export const metadata: Metadata = {
  title: 'しおり一覧 | Journee',
  description: '作成した旅のしおり一覧。お気に入りのしおりを探して、編集・共有できます。',
  openGraph: {
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおり一覧',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'しおり一覧 | Journee',
    description: '作成した旅のしおり一覧',
    images: ['/api/og/default'],
  },
};

export default function ItinerariesPage() {
  return <ItineraryListClient />;
}
```

#### 2.3 その他の静的ページ

**対象ページ:**
- `/privacy`: プライバシーポリシー
- `/terms`: 利用規約
- `/login`: ログインページ
- `/settings`: 設定ページ

**実装方針:**
各ページに適切な`generateMetadata`または`metadata`を追加

**例（`app/privacy/page.tsx`）:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Journee',
  description: 'Journeeのプライバシーポリシー。個人情報の取り扱いについて説明します。',
  openGraph: {
    title: 'プライバシーポリシー | Journee',
    description: 'Journeeのプライバシーポリシー',
    type: 'website',
    images: ['/api/og/default'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Phase 3: OGP画像のキャッシュ戦略 🎯 優先度: 低

#### 3.1 Vercel Image Optimization活用

**実装内容:**
- Next.js の`ImageResponse`は自動的にVercelのEdge Networkでキャッシュされる
- `Cache-Control`ヘッダーを適切に設定して、再生成頻度を制御

**ファイル:** `app/api/og/route.tsx`, `app/api/og/default/route.tsx`

**追加実装:**
```typescript
export async function GET(request: NextRequest) {
  // ... 画像生成ロジック ...

  const response = new ImageResponse(
    // ... JSX ...
    { width: 1200, height: 630 }
  );

  // キャッシュ設定（1日間）
  response.headers.set(
    'Cache-Control',
    'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
  );

  return response;
}
```

### Phase 4: エラーハンドリングと検証 🎯 優先度: 中

#### 4.1 OGP画像生成時のエラーハンドリング強化

**ファイル:** `app/api/og/route.tsx`

**改善内容:**
- データベース接続エラー時のフォールバック
- 画像生成失敗時のログ記録
- より詳細なエラーメッセージ

#### 4.2 OGP検証ツールでのテスト

**検証方法:**
1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

**テスト対象:**
- トップページ (`/`)
- しおり共有ページ (`/share/[slug]`)
- マイページ (`/mypage`)
- しおり一覧 (`/itineraries`)
- 各静的ページ

**テスト項目:**
- [ ] 画像が正しく表示される
- [ ] タイトルが適切に設定されている
- [ ] 説明文が適切に設定されている
- [ ] Twitter Cardが正しく表示される
- [ ] 画像サイズが1200x630pxである

## 実装スケジュール

### 第1週: Phase 1（デフォルトOGP画像）
- [ ] デフォルトOGP画像生成API実装 (`/api/og/default`)
- [ ] `app/layout.tsx`の更新
- [ ] 動作確認・検証

### 第2週: Phase 2（各ページのメタデータ）
- [ ] マイページのメタデータ設定
- [ ] しおり一覧ページのサーバーコンポーネント化
- [ ] 静的ページのメタデータ設定
- [ ] 動作確認・検証

### 第3週: Phase 3 & 4（最適化と検証）
- [ ] キャッシュ戦略の実装
- [ ] エラーハンドリング強化
- [ ] 各種OGP検証ツールでのテスト
- [ ] ドキュメント作成（`docs/OGP_TESTING.md`）

## 技術仕様

### OGP画像サイズ
- **推奨サイズ**: 1200x630px
- **最小サイズ**: 600x315px
- **アスペクト比**: 1.91:1
- **ファイルサイズ**: < 8MB（実際は数百KB程度）

### 対応SNS
- Facebook
- Twitter (X)
- LinkedIn
- Slack
- Discord
- その他（OGP準拠のプラットフォーム）

### 必須メタタグ
```html
<!-- Open Graph -->
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```

## セキュリティ考慮事項

1. **個人情報保護**
   - マイページのOGPには個人を特定できる情報を含めない
   - ユーザー名のみを含め、メールアドレス等は含めない

2. **公開設定の尊重**
   - 非公開しおりのOGP画像は生成しない
   - 公開しおりのみOGP画像を生成

3. **レート制限**
   - OGP画像生成APIのレート制限を設定（Vercel自動対応）

## パフォーマンス考慮事項

1. **Edge Runtime使用**
   - `export const runtime = 'edge';`を設定し、高速レスポンス

2. **画像キャッシュ**
   - CDNによる自動キャッシュ
   - 適切な`Cache-Control`ヘッダー設定

3. **画像最適化**
   - Next.js ImageResponseによる最適化
   - 適切な画像圧縮

## 成功指標

### 定量指標
- [ ] すべての主要ページでOGP画像が正しく表示される
- [ ] OGP検証ツールでエラーがゼロになる
- [ ] 画像生成APIのレスポンスタイムが500ms以下

### 定性指標
- [ ] SNSでシェアした際の見栄えが向上
- [ ] ユーザーからのフィードバックが肯定的
- [ ] クリック率の向上（SNSからの流入）

## ドキュメント

実装完了後、以下のドキュメントを作成・更新：

1. **`docs/OGP_TESTING.md`**
   - OGP画像のテスト手順
   - 各種検証ツールの使用方法
   - トラブルシューティング

2. **`docs/API.md`**
   - `/api/og`と`/api/og/default`の仕様を追記

3. **`README.md`**
   - OGP機能の説明を追加

## 参考リンク

- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)

## 備考

- 既存の`/api/og`（しおり共有用）は非常に良い実装なので、そのまま維持
- デフォルトOGP画像は動的生成により、将来的なデザイン変更にも柔軟に対応可能
- すべての実装はNext.js 14のApp Router規約に準拠
