# OGP画像実装ドキュメント

## 概要

Journeeのしおり共有時やアプリケーション全体でSNS共有時に適切なOGP（Open Graph Protocol）画像が表示されるように、動的OGP画像生成機能を実装しました。

## 実装の背景

### 課題
- デフォルトOGP画像が設定されていない（`/images/og-default.png`が存在しない）
- 主要ページ（マイページ、しおり一覧、設定など）でOGPメタデータが未設定
- SNS共有時に空白または一般的なプレビューが表示される
- ユーザーエンゲージメントとブランド認知度の低下

### 目的
- すべてのページで適切なOGP画像とメタデータを提供
- SNS共有時のリッチプレビュー表示
- ブランド認知度の向上
- SEO最適化

## 実装内容

### Phase 1: デフォルトOGP画像API

#### 実装ファイル
- `app/api/og/default/route.tsx`

#### 機能
- Next.js `ImageResponse`を使用した動的画像生成
- Edge Runtimeで高速レスポンス
- 1200x630pxの標準OGP画像サイズ
- Journeeブランドのグラデーション背景
- ブランドロゴとキャッチフレーズを表示

#### デザイン要素
- **背景**: 紫からピンクへのグラデーション（#667eea → #764ba2）
- **装飾**: 半透明ドットパターン
- **アイコン**: ✈️ エモジ（飛行機）
- **ロゴ**: "Journee" 72pxフォント、白色、レタースペーシング4px
- **サブタイトル**: "AI旅のしおり作成アプリ" 32px
- **キャッチフレーズ**: "チャット形式で簡単に旅行計画を立てる" 24px

#### エラーハンドリング
- エラー時はシンプルなフォールバック画像を生成
- 常に200 OKレスポンスを返し、画像生成の失敗を防ぐ

### Phase 2: ルートレイアウトの更新

#### 実装ファイル
- `app/layout.tsx`

#### 変更内容
```diff
- url: '/images/og-default.png',
+ url: '/api/og/default',
```

#### 影響範囲
- すべてのページのデフォルトOGP画像が動的生成APIを使用
- 静的ファイルの管理が不要に

### Phase 3: 各ページへのOGPメタデータ追加

#### 3.1 マイページ（`app/mypage/page.tsx`）

**特徴**
- サーバーコンポーネントで`generateMetadata`を実装
- ユーザー名を含む動的メタデータ
- 検索エンジンにインデックスさせない（プライベートページ）

**メタデータ**
- Title: `{userName}のマイページ | Journee`
- Description: ユーザーの旅行記録とアクティビティの説明
- robots: `{ index: false, follow: true }`
- OGP type: `profile`

#### 3.2 しおり一覧ページ（`app/itineraries/page.tsx`）

**アーキテクチャ変更**
- クライアントコンポーネントからサーバーコンポーネントに変更
- クライアントロジックを`components/itinerary/ItineraryListClient.tsx`に分離

**メタデータ**
- Title: `しおり一覧 | Journee`
- Description: しおり管理機能の説明
- robots: `{ index: false, follow: true }` （ユーザー固有のため）

**新規ファイル**
- `components/itinerary/ItineraryListClient.tsx`: UIロジックとインタラクションを含むクライアントコンポーネント

#### 3.3 プライバシーポリシー（`app/privacy/page.tsx`）

**メタデータ**
- Title: `プライバシーポリシー | Journee`
- Description: 個人情報の取扱いに関する説明
- robots: `{ index: true, follow: true }` （公開ページ）

#### 3.4 利用規約（`app/terms/page.tsx`）

**メタデータ**
- Title: `利用規約 | Journee`
- Description: サービスの利用条件に関する説明
- robots: `{ index: true, follow: true }` （公開ページ）

#### 3.5 ログインページ（`app/login/page.tsx`）

**メタデータ**
- Title: `ログイン | Journee`
- Description: Googleアカウントでのログイン案内
- robots: `{ index: true, follow: true }`

#### 3.6 設定ページ（`app/settings/layout.tsx`）

**アーキテクチャ**
- クライアントコンポーネント（`page.tsx`）のため、`layout.tsx`でメタデータを定義

**メタデータ**
- Title: `設定 | Journee`
- Description: アプリケーション設定の説明
- robots: `{ index: false, follow: true }` （プライベートページ）

**新規ファイル**
- `app/settings/layout.tsx`: 設定ページ専用のレイアウトとメタデータ

### Phase 4: 既存実装の確認

#### 公開しおりページ（`app/share/[slug]/page.tsx`）

**既に実装済み**
- Phase 10.2で動的OGP画像生成が実装済み
- `/api/og?slug={slug}` を使用した個別OGP画像
- しおりの内容（タイトル、目的地、日程）に基づいた画像生成
- 構造化データ（JSON-LD）も実装済み

## OGPメタデータの構造

### 基本構造

```typescript
export const metadata: Metadata = {
  title: 'ページタイトル | Journee',
  description: 'ページの説明',
  robots: {
    index: true/false,  // 検索エンジンインデックス
    follow: true,       // リンク追跡
  },
  openGraph: {
    title: 'OGタイトル',
    description: 'OG説明',
    type: 'website' | 'profile',
    url: '/page-path',
    siteName: 'Journee',
    locale: 'ja_JP',
    images: [
      {
        url: '/api/og/default',
        width: 1200,
        height: 630,
        alt: '画像の代替テキスト',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twitterカードタイトル',
    description: 'Twitterカード説明',
    images: ['/api/og/default'],
  },
};
```

### robots設定の方針

| ページタイプ | index | 理由 |
|------------|-------|------|
| 公開ページ（/, /privacy, /terms, /login） | true | SEO対象 |
| プライベートページ（/mypage, /itineraries, /settings） | false | ユーザー固有データ |
| 公開しおり（/share/[slug]） | true | 共有可能なコンテンツ |

## 技術仕様

### 使用技術
- **Next.js 14+**: App Router、Server Components
- **next/og**: ImageResponse API
- **Edge Runtime**: 高速な画像生成

### 画像生成パフォーマンス
- **サイズ**: 1200x630px（OGP標準）
- **フォーマット**: PNG
- **レンダリング**: Edge Runtime（低レイテンシ）
- **キャッシュ**: ブラウザキャッシュ、CDNキャッシュ対応

### SEO最適化
- 適切なメタデータ設定
- 構造化データ（JSON-LD）※公開しおりのみ
- canonicalURL設定
- keywords設定（関連ページ）

## ファイル構成

### 新規作成ファイル
```
app/
├── api/
│   └── og/
│       └── default/
│           └── route.tsx          # デフォルトOGP画像API
├── settings/
│   └── layout.tsx                 # 設定ページレイアウト（メタデータ）
components/
└── itinerary/
    └── ItineraryListClient.tsx    # しおり一覧クライアントコンポーネント
docs/
└── OGP_IMPLEMENTATION.md          # 本ドキュメント
```

### 更新ファイル
```
app/
├── layout.tsx                      # ルートレイアウト（デフォルトOGP更新）
├── mypage/page.tsx                 # マイページ（メタデータ追加）
├── itineraries/page.tsx            # しおり一覧（サーバーコンポーネント化）
├── privacy/page.tsx                # プライバシーポリシー（メタデータ追加）
├── terms/page.tsx                  # 利用規約（メタデータ追加）
└── login/page.tsx                  # ログインページ（メタデータ追加）
```

## テスト・検証

### ビルド確認
```bash
npm run type-check  # ✅ 成功（テストファイルの既存エラー除く）
npm run lint        # ✅ 成功（警告のみ）
npm run build       # ✅ 成功
```

### OGP検証ツール
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### 検証項目
- [ ] `/api/og/default`にアクセスして画像が表示される
- [ ] 各ページのHTMLに`<meta property="og:*">`タグが含まれる
- [ ] Twitter Card Validatorでプレビューが正しく表示される
- [ ] Facebook Sharing Debuggerでプレビューが正しく表示される
- [ ] 本番環境でのOGP画像生成動作確認

## デプロイ

### 環境変数
OGP画像生成には追加の環境変数は不要です。

### 注意事項
- Edge Runtimeを使用しているため、一部のNode.js APIは使用不可
- `metadataBase`が正しく設定されていることを確認（`app/layout.tsx`）
- 本番環境で`NEXT_PUBLIC_BASE_URL`または`VERCEL_URL`が設定されていることを確認

### デプロイ後の確認
1. `https://your-domain.com/api/og/default`にアクセスして画像が表示されることを確認
2. 各ページをSNSで共有して、プレビューが正しく表示されることを確認
3. OGP検証ツールでメタデータを確認

## パフォーマンス最適化

### 現状
- Edge Runtimeによる低レイテンシ画像生成
- 動的生成のためビルド時間への影響なし
- ブラウザキャッシュとCDNキャッシュが有効

### 今後の改善案
1. **キャッシュ戦略の強化**
   - `Cache-Control`ヘッダーの最適化
   - 長期キャッシュの設定（デフォルトOGP画像は変更が少ない）

2. **画像最適化**
   - WebP形式のサポート（ブラウザによる）
   - 解像度の最適化

3. **モニタリング**
   - OGP画像生成のレスポンスタイム計測
   - エラーレートの監視

## トラブルシューティング

### 画像が表示されない
1. `/api/og/default`に直接アクセスして画像が生成されるか確認
2. ブラウザの開発者ツールでネットワークタブを確認
3. サーバーログでエラーを確認

### メタデータが反映されない
1. ブラウザの開発者ツールでHTML内の`<meta>`タグを確認
2. `generateMetadata`が正しく実行されているか確認
3. キャッシュをクリアして再度アクセス

### SNSでプレビューが表示されない
1. OGP検証ツールでメタデータを確認
2. `metadataBase`が正しく設定されているか確認（絶対URLが必要）
3. SNSのキャッシュをクリア（Facebook Debuggerの"Scrape Again"など）

## 関連ドキュメント

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Image Response](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [docs/METADATA_ENHANCEMENT.md](./METADATA_ENHANCEMENT.md) - メタデータ拡張ドキュメント

## まとめ

この実装により、Journeeのすべてのページで適切なOGP画像とメタデータが提供され、SNS共有時のユーザー体験が大幅に向上しました。

### 実装の成果
- ✅ デフォルトOGP画像の動的生成
- ✅ 全ページへのOGPメタデータ追加
- ✅ SEO最適化
- ✅ ブランド認知度の向上

### 今後の展開
- ユーザープロフィール画像を含むOGP画像の生成
- しおり一覧ページの個別OGP画像（将来的に）
- A/Bテストによるデザイン最適化
