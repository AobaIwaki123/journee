# npm build 失敗防止策 実装計画

## 1. 背景と目的

### 現状の課題
- `npm run build` がよく失敗する
- ビルド失敗の原因が多岐にわたり、事前に防ぐことが難しい
- 開発者がビルド前にチェックすべき項目が明確でない

### 目的
- ビルド前の事前チェックリストを確立
- 開発ガイドラインとして文書化
- Cursor AIによる自動チェックの仕組みを構築
- ビルド失敗率を大幅に削減

## 2. よくあるnpm build失敗原因の分析

### 2.1 TypeScript関連エラー
```
原因:
- 型エラー（型の不一致、undefined可能性など）
- 未定義の変数・プロパティへのアクセス
- 厳格な型チェック（strict: true）による検出

影響度: ★★★★★ (非常に高い)
```

### 2.2 ESLint関連エラー
```
原因:
- 未使用のimport文
- 未使用の変数定義
- コーディング規約違反（no-console, no-unused-varsなど）
- React Hooks依存配列の不備

影響度: ★★★★☆ (高い)
```

### 2.3 環境変数の欠落
```
原因:
- 必須環境変数が設定されていない
- .env.localの設定漏れ
- ビルド時のみ必要な環境変数の未設定

影響度: ★★★☆☆ (中程度)
```

### 2.4 依存関係の問題
```
原因:
- package.jsonの不整合
- node_modulesの破損
- バージョン競合

影響度: ★★☆☆☆ (低い)
```

### 2.5 Next.js特有の問題
```
原因:
- サーバーコンポーネントとクライアントコンポーネントの混在
- 動的importの不適切な使用
- App Routerの規約違反
- メタデータAPIの誤用

影響度: ★★★☆☆ (中程度)
```

## 3. 実装内容

### 3.1 LINT.md（ビルド前チェックリスト）の作成

**配置場所**: `docs/LINT.md`

**内容構成**:
1. ビルド前の必須チェック項目
2. コマンド実行順序
3. エラー別の対処法
4. トラブルシューティング
5. ベストプラクティス

**チェック項目**:
```markdown
## 必須チェック項目

### Level 1: 基本チェック（所要時間: 30秒）
- [ ] `npm run type-check` が成功する
- [ ] `npm run lint` が成功する
- [ ] 未使用のimport文がない
- [ ] console.log の削除（デバッグコード）

### Level 2: 環境チェック（所要時間: 1分）
- [ ] .env.local に必須環境変数が設定されている
- [ ] GEMINI_API_KEY が設定されている（開発環境）
- [ ] NEXTAUTH_SECRET が設定されている
- [ ] NEXTAUTH_URL が正しい
- [ ] DATABASE_URLが設定されている（本番環境）

### Level 3: コード品質チェック（所要時間: 2分）
- [ ] 新規追加したコンポーネントに型定義がある
- [ ] async関数のエラーハンドリングが実装されている
- [ ] useEffectの依存配列が正しい
- [ ] 'use client'と'use server'の使い分けが正しい

### Level 4: ビルドテスト（所要時間: 3分）
- [ ] `npm run build` がローカルで成功する
- [ ] ビルド後の.nextフォルダが生成されている
- [ ] 警告メッセージがない、または許容範囲内

### Level 5: 最終確認（所要時間: 1分）
- [ ] package.jsonに不要な依存関係がない
- [ ] node_modulesが最新（必要に応じて npm install）
- [ ] Gitで追跡されていないビルドファイルがない
```

### 3.2 Cursor Rule（.cursorrules）への追加

**配置場所**: `.cursor/rules/build-check.mdc`

**内容**:
```markdown
# ビルドチェックルール

## コード変更時の必須チェック

1. **型安全性の確保**
   - すべての関数に戻り値の型を明示
   - any型の使用を避ける
   - 外部APIのレスポンスにはZodバリデーションを使用

2. **ESLintエラーの即時修正**
   - コード保存時にESLintエラーを確認
   - 未使用のimportは即座に削除
   - console.logは削除またはコメントアウト

3. **Next.js規約の遵守**
   - クライアントコンポーネントには'use client'を明示
   - サーバーアクションには'use server'を明示
   - メタデータはgenerateMetadata関数で定義

4. **ビルド前の確認**
   - コミット前に`npm run type-check`を実行
   - プルリクエスト前に`npm run build`を実行
   - エラーが出た場合は必ず修正してからコミット

5. **AI支援の活用**
   - ビルドエラーが出た場合は、エラーメッセージをCursorに貼り付けて解決策を相談
   - 型エラーの修正はAIに依頼可能
   - ESLintエラーの一括修正もAIに依頼可能
```

### 3.3 pre-commit hookの追加（オプション）

**配置場所**: `.husky/pre-commit` または `package.json`の`husky`セクション

**内容**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Type check
echo "📝 Type checking..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed. Please fix the errors and try again."
  exit 1
fi

# Lint check
echo "🔎 Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lint check failed. Please fix the errors and try again."
  exit 1
fi

echo "✅ All checks passed!"
```

### 3.4 GitHub Actions ワークフローの追加

**配置場所**: `.github/workflows/build-check.yml`

**内容**:
```yaml
name: Build Check

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint check
      run: npm run lint
    
    - name: Build
      run: npm run build
      env:
        GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
        NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3.5 VSCode設定の追加（推奨）

**配置場所**: `.vscode/settings.json`

**内容**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.next": true,
    "**/node_modules": true
  }
}
```

## 4. 実装手順

### Phase 1: ドキュメント作成（優先度: 最高）
**所要時間**: 1時間

1. `docs/LINT.md` を作成
   - チェックリストの詳細記述
   - コマンド例の追加
   - トラブルシューティングセクション

2. 既存の `docs/GUIDELINE.md` に参照を追加
   ```markdown
   ## ビルド前チェック
   
   コミット前には必ず [LINT.md](./LINT.md) のチェックリストを確認してください。
   ```

### Phase 2: Cursor Rule追加（優先度: 高）
**所要時間**: 30分

1. `.cursor/rules/build-check.md` を作成
2. または既存の `.cursorrules` に追記
3. ルールの有効化確認

### Phase 3: 自動化設定（優先度: 中）
**所要時間**: 2時間

1. Huskyのインストール
   ```bash
   npm install --save-dev husky
   npx husky install
   npm set-script prepare "husky install"
   npx husky add .husky/pre-commit "npm run type-check && npm run lint"
   ```

2. `.husky/pre-commit` の作成と権限設定
   ```bash
   chmod +x .husky/pre-commit
   ```

### Phase 4: CI/CD統合（優先度: 中）
**所要時間**: 1時間

1. `.github/workflows/build-check.yml` を作成
2. GitHub Secretsに必要な環境変数を設定
3. テスト実行して動作確認

### Phase 5: VSCode設定（優先度: 低）
**所要時間**: 15分

1. `.vscode/settings.json` を作成
2. チームメンバーに設定の適用を推奨

### Phase 6: 周知と教育（優先度: 高）
**所要時間**: 1時間

1. README.mdに追記
   ```markdown
   ## ビルド前チェック
   
   コミット前には必ず以下を実行してください：
   
   \`\`\`bash
   npm run type-check
   npm run lint
   npm run build
   \`\`\`
   
   詳細は [docs/LINT.md](docs/LINT.md) を参照してください。
   ```

2. 既存のチームメンバーへの周知
3. Slackやドキュメントでの共有

## 5. 詳細なチェックコマンド

### 5.1 基本チェックコマンド

```bash
# 型チェック（TypeScript）
npm run type-check

# Lintチェック（ESLint）
npm run lint

# Lint自動修正
npm run lint -- --fix

# ビルド実行
npm run build

# すべてを順次実行
npm run type-check && npm run lint && npm run build
```

### 5.2 詳細チェックコマンド

```bash
# 特定ファイルの型チェック
npx tsc --noEmit app/page.tsx

# 特定ファイルのLint
npx eslint app/page.tsx

# キャッシュクリア後のビルド
rm -rf .next && npm run build

# 依存関係の再インストール
rm -rf node_modules package-lock.json && npm install

# ビルドサイズの確認
npm run build && du -sh .next
```

## 6. エラー別トラブルシューティング

### 6.1 TypeScriptエラー

**エラー例**:
```
Type 'string | undefined' is not assignable to type 'string'.
```

**対処法**:
```typescript
// ❌ 悪い例
const value: string = process.env.NEXT_PUBLIC_API_URL;

// ✅ 良い例
const value: string = process.env.NEXT_PUBLIC_API_URL || '';

// ✅ さらに良い例（バリデーション付き）
const value = process.env.NEXT_PUBLIC_API_URL;
if (!value) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}
```

### 6.2 ESLintエラー

**エラー例**:
```
'React' is defined but never used. eslint(@typescript-eslint/no-unused-vars)
```

**対処法**:
```typescript
// ❌ 悪い例
import React from 'react';

// ✅ 良い例（Next.js 13以降は不要）
// import文を削除

// または、実際に使う場合のみimport
import { useState } from 'react';
```

### 6.3 Next.js警告

**エラー例**:
```
You're importing a component that needs useState. This only works in a Client Component...
```

**対処法**:
```typescript
// ❌ 悪い例（サーバーコンポーネントでuseStateを使用）
export default function Page() {
  const [state, setState] = useState();
  // ...
}

// ✅ 良い例
'use client';

export default function Page() {
  const [state, setState] = useState();
  // ...
}
```

### 6.4 環境変数エラー

**エラー例**:
```
Error: NEXTAUTH_SECRET is not defined
```

**対処法**:
1. `.env.local` ファイルを作成
   ```bash
   cp .env.example .env.local
   ```

2. 必要な環境変数を設定
   ```
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   GEMINI_API_KEY=your-api-key
   ```

3. 開発サーバーを再起動
   ```bash
   npm run dev
   ```

## 7. ベストプラクティス

### 7.1 開発フロー

```
1. コード編集
   ↓
2. 保存時に自動フォーマット（VSCode設定）
   ↓
3. npm run type-check（型チェック）
   ↓
4. npm run lint（Lint）
   ↓
5. npm run lint -- --fix（自動修正）
   ↓
6. 手動修正（必要な場合）
   ↓
7. npm run build（ビルド確認）
   ↓
8. git add & git commit
   ↓
9. pre-commit hook実行（自動）
   ↓
10. git push
   ↓
11. CI/CDでビルドチェック（自動）
```

### 7.2 コミット前のクイックチェック

```bash
# ワンライナーで全チェック
npm run type-check && npm run lint && echo "✅ Ready to commit!"

# エイリアス設定（オプション）
# package.jsonに追加
"scripts": {
  "precommit": "npm run type-check && npm run lint"
}

# 使い方
npm run precommit
```

### 7.3 AIとの協働

**Cursorでの活用例**:

1. **型エラーの修正**
   ```
   プロンプト: "このファイルの型エラーを修正してください"
   ```

2. **未使用import削除**
   ```
   プロンプト: "未使用のimportをすべて削除してください"
   ```

3. **ESLint違反の修正**
   ```
   プロンプト: "ESLintエラーを修正してください"
   ```

4. **ビルドエラーの解決**
   ```
   プロンプト: "次のビルドエラーを解決してください: [エラーメッセージ]"
   ```

## 8. 期待される効果

### 8.1 定量的効果

- **ビルド失敗率**: 80%削減（目標）
- **エラー修正時間**: 50%短縮（目標）
- **コミット前の手戻り**: 90%削減（目標）

### 8.2 定性的効果

- 開発者のストレス軽減
- コードレビューの品質向上
- CI/CDパイプラインの安定化
- オンボーディング時間の短縮
- チーム全体のコード品質向上

### 8.3 測定指標

- ビルド成功率（GitHub Actions）
- 平均ビルド時間
- コミット前のエラー検出率
- pre-commit hookの実行成功率

## 9. 今後の改善案

### 9.1 短期（1-2週間）
- [ ] チェックリストの運用開始
- [ ] フィードバック収集
- [ ] ドキュメントの改善

### 9.2 中期（1-2ヶ月）
- [ ] pre-commit hookの導入
- [ ] CI/CDの最適化
- [ ] 自動修正スクリプトの拡充

### 9.3 長期（3ヶ月以上）
- [ ] カスタムESLintルールの作成
- [ ] ビルドパフォーマンスの最適化
- [ ] 型安全性の更なる向上

## 10. 実装優先順位

### 最優先（即座に実施）
1. ✅ **LINT.mdの作成** - 今すぐ実施可能
2. ✅ **Cursor Ruleの追加** - 今すぐ実施可能
3. ✅ **README.mdへの追記** - 今すぐ実施可能

### 高優先（1週間以内）
4. ⏳ **pre-commit hookの導入** - 開発環境の改善
5. ⏳ **VSCode設定の追加** - 開発者体験の向上

### 中優先（2週間以内）
6. ⏳ **GitHub Actionsの追加** - CI/CDの強化
7. ⏳ **チーム周知** - 運用の定着

### 低優先（1ヶ月以内）
8. ⏳ **効果測定** - データ収集と分析
9. ⏳ **改善提案** - 継続的な最適化

## 11. まとめ

本実装計画により、npm buildの失敗を事前に防ぎ、開発効率を大幅に向上させることができます。

**重要なポイント**:
1. **チェックリストの習慣化** - コミット前の確認を習慣に
2. **自動化の活用** - 人的ミスを減らす
3. **AIとの協働** - Cursorを活用した効率的な修正
4. **継続的改善** - フィードバックを元に改善

**次のアクション**:
1. この計画をチームで共有
2. Phase 1（ドキュメント作成）を即座に開始
3. 1週間後に運用状況をレビュー
4. 必要に応じて計画を調整

---

**作成日**: 2025-10-12  
**最終更新**: 2025-10-12  
**ステータス**: 実装待ち  
**担当**: 開発チーム全員
