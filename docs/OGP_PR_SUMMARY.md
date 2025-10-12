# OGP画像実装 - PR Summary

## 概要

Closes #[PR_NUMBER]

しおり共有時やJournee全体の共有時に、適切なOGP（Open Graph Protocol）画像が表示されるようにする実装。
SNSでシェアした際に魅力的なプレビュー画像が表示されることで、ユーザーエンゲージメントとアプリの認知度向上を図る。

## 背景（Issue より）

現状、以下の問題が発生しています：

1. **デフォルトOGP画像の不在**
   - `app/layout.tsx`で`/images/og-default.png`を参照しているが、ファイルが存在しない
   - トップページをSNSでシェアしても画像が表示されない

2. **各ページのOGP未設定**
   - マイページ、しおり一覧ページなどでOGPメタデータが設定されていない
   - これらのページをシェアしても適切なプレビューが表示されない

3. **しおり共有ページは実装済み**
   - `/share/[slug]`のみOGP画像とメタデータが適切に設定されている
   - この良い実装を他のページにも展開する必要がある

## 実装内容

### 1. デフォルトOGP画像生成API 🎯

**新規ファイル:** `app/api/og/default/route.tsx`

- Journeeブランドを表現する美しいデフォルトOGP画像を動的生成
- Next.js `ImageResponse`を使用したEdge Runtime実装
- 以下の要素を含むデザイン：
  - ✈️ アイコン
  - Journeeロゴ
  - キャッチコピー「AI旅のしおり作成アプリ」
  - グラデーション背景（紫系）

**技術仕様:**
- サイズ: 1200x630px（OGP標準）
- Runtime: Edge（高速レスポンス）
- キャッシュ: 1日間（`Cache-Control`ヘッダー設定）

### 2. ルートレイアウト更新

**変更ファイル:** `app/layout.tsx`

- 存在しない静的画像パス（`/images/og-default.png`）を動的生成API（`/api/og/default`）に変更
- Open GraphとTwitter Cardのメタデータを更新

```typescript
// Before
images: ['/images/og-default.png']

// After
images: ['/api/og/default']
```

### 3. マイページのOGPメタデータ設定

**変更ファイル:** `app/mypage/page.tsx`

- `generateMetadata`関数を追加
- ユーザー情報を含むメタデータを動的生成
- 個人情報保護に配慮した設計（名前のみ、メールアドレス等は含めない）

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const user = await getCurrentUser();
  return {
    title: `${user.name}のマイページ | Journee`,
    description: `${user.name}の旅行記録とアクティビティ`,
    openGraph: { ... },
    twitter: { ... },
  };
}
```

### 4. しおり一覧ページのサーバーコンポーネント化

**変更ファイル:**
- `app/itineraries/page.tsx`: サーバーコンポーネント化、メタデータ設定
- `components/itinerary/ItineraryListClient.tsx`: クライアント側ロジック分離（新規作成）

**理由:**
- クライアントコンポーネント（`'use client'`）ではメタデータを設定できない
- フィルター・ソート機能はクライアント側に分離し、ページ自体はサーバーコンポーネントに

### 5. 静的ページのOGPメタデータ設定

**対象ページ:**
- `/privacy`: プライバシーポリシー
- `/terms`: 利用規約
- `/login`: ログインページ
- `/settings`: 設定ページ

**実装:**
各ページに適切な`metadata`オブジェクトまたは`generateMetadata`関数を追加

### 6. キャッシュ戦略とエラーハンドリング

**変更ファイル:**
- `app/api/og/route.tsx`: 既存のしおりOGP画像生成API
- `app/api/og/default/route.tsx`: 新規デフォルトOGP画像生成API

**改善内容:**
- `Cache-Control`ヘッダーの適切な設定（1日間キャッシュ）
- エラー時のフォールバック強化
- ログ記録の改善

## 技術的な判断

### 1. 静的画像ではなく動的生成を選択

**理由:**
- デザイン変更に柔軟に対応可能
- ブランドイメージの統一が容易
- 将来的なカスタマイズ（言語対応等）が可能

### 2. Edge Runtimeの使用

**理由:**
- OGP画像は初回アクセス時に生成される必要がある
- Edgeでの実行により、グローバルで高速レスポンス
- Vercelのインフラストラクチャと相性が良い

### 3. しおり一覧ページのサーバーコンポーネント化

**理由:**
- メタデータ設定にはサーバーコンポーネントが必須
- フィルター・ソート状態をURLパラメータで管理することで、ブックマーク可能に
- SEOの向上

## テスト方法

### 自動テスト
- [ ] `npm run type-check`: 型チェック成功
- [ ] `npm run lint`: Lint成功
- [ ] `npm run build`: ビルド成功

### 手動テスト

#### 1. デフォルトOGP画像
```bash
# 開発環境
curl http://localhost:3000/api/og/default -I

# 期待結果: 200 OK, Content-Type: image/png
```

#### 2. OGP検証ツール

**Facebook Sharing Debugger:**
https://developers.facebook.com/tools/debug/

テストURL:
- `https://your-domain.com/`
- `https://your-domain.com/mypage`
- `https://your-domain.com/itineraries`
- `https://your-domain.com/share/[slug]`

**Twitter Card Validator:**
https://cards-dev.twitter.com/validator

**確認項目:**
- [ ] 画像が1200x630pxで表示される
- [ ] タイトルが正しく表示される
- [ ] 説明文が正しく表示される
- [ ] エラーがゼロ

### E2Eテスト（オプション）

新規E2Eテストファイル: `e2e/ogp-images.spec.ts`

```typescript
test('トップページのOGP画像が設定されている', async ({ page }) => {
  await page.goto('/');
  
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogImage).toContain('/api/og/default');
});
```

## ビルド・デプロイ確認

### ビルド確認
```bash
npm run type-check  # TypeScript型チェック
npm run lint        # ESLint
npm run build       # Next.js ビルド
```

### デプロイ後確認
1. 本番環境で各ページにアクセス
2. ブラウザの開発者ツールで`<meta>`タグを確認
3. Facebook/Twitter検証ツールで各URLをテスト

## スクリーンショット

### デフォルトOGP画像（トップページ用）

![デフォルトOGP画像](https://placehold.co/1200x630/667eea/white?text=Journee+Default+OGP)

**デザイン要素:**
- ✈️ アイコン（中央上部）
- Journeeロゴ（大きく中央）
- キャッチコピー（中央下部）
- 紫系グラデーション背景

### しおりOGP画像（既存・参考）

![しおりOGP画像](https://placehold.co/1200x630/667eea/white?text=Itinerary+OGP)

**デザイン要素:**
- しおりタイトル
- 目的地
- 日数
- 概要（オプション）

## パフォーマンスへの影響

### 想定される影響

**良い影響:**
- SNSからのクリック率向上（10-30%改善見込み）
- ブランド認知度の向上
- SEOの改善（構造化データ含む）

**懸念される影響:**
- 初回OGP画像生成時のレイテンシ（約200-500ms）
  - **対策**: Edgeキャッシュにより2回目以降は高速（< 50ms）

### モニタリング項目
- OGP画像生成APIのレスポンスタイム
- エラー率
- SNSからの流入数（Google Analytics）

## 既存機能への影響

### 影響なし（既存機能は維持）
- ✅ しおり共有ページのOGP画像（既に実装済み）
- ✅ チャット機能
- ✅ しおり作成・編集機能
- ✅ 認証機能

### 改善される機能
- ✅ SNS共有時のプレビュー表示
- ✅ SEO（検索エンジン最適化）
- ✅ ブランドイメージの統一

## セキュリティ考慮事項

1. **個人情報保護**
   - マイページのOGPにはユーザー名のみ含め、メールアドレス等は含めない
   - 認証が必要なページは`robots: { index: false }`を設定

2. **公開設定の尊重**
   - 非公開しおりのOGP画像は生成しない（既存実装で対応済み）
   - 公開しおりのみOGP画像を生成

3. **レート制限**
   - Vercelの自動レート制限により悪用を防止

## ドキュメント更新

実装と同時に以下のドキュメントを作成・更新：

- ✅ `docs/OGP_IMPLEMENTATION_PLAN.md`: 詳細実装計画
- ✅ `docs/OGP_PR_SUMMARY.md`: このドキュメント
- 📋 `docs/OGP_TESTING.md`: テスト手順（実装後に作成）
- 📋 `docs/API.md`: API仕様に`/api/og/default`を追記
- 📋 `README.md`: OGP機能の説明を追加

## チェックリスト

### 実装
- [ ] `/api/og/default` APIを実装
- [ ] `app/layout.tsx`を更新
- [ ] マイページのメタデータ設定
- [ ] しおり一覧ページのサーバーコンポーネント化
- [ ] 静的ページのメタデータ設定
- [ ] キャッシュ戦略の実装
- [ ] エラーハンドリング強化

### テスト
- [ ] `npm run type-check` 成功
- [ ] `npm run lint` 成功
- [ ] `npm run build` 成功
- [ ] Facebook Sharing Debuggerで検証
- [ ] Twitter Card Validatorで検証
- [ ] 手動動作確認

### ドキュメント
- [ ] `docs/OGP_TESTING.md`作成
- [ ] `docs/API.md`更新
- [ ] `README.md`更新

## 関連ドキュメント

- [docs/OGP_IMPLEMENTATION_PLAN.md](./OGP_IMPLEMENTATION_PLAN.md) - 詳細実装計画
- [app/api/og/route.tsx](../app/api/og/route.tsx) - しおりOGP画像生成API（既存）
- [app/share/[slug]/page.tsx](../app/share/[slug]/page.tsx) - しおり共有ページ（OGP実装済み参考）

## まとめ

この実装により、Journeeのすべての主要ページでSNS共有時に適切なOGP画像が表示されるようになります。
既存の優れた実装（しおり共有ページ）をベースに、アプリ全体で一貫したブランドイメージを提供し、
ユーザーエンゲージメントとアプリの認知度向上を実現します。
