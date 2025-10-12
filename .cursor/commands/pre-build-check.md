# Pre-build Check Command

このコマンドは、コミット前に必要なチェックを実行して、ビルドエラーを未然に防ぎます。

## 使用方法

Cursor AI に以下のように指示してください：

```
@pre-build-check
```

または

```
コミット前チェックを実行してください
```

## 実行内容

このコマンドは以下のチェックを順番に実行します：

### 1. 型チェック (Type Check)

```bash
npm run type-check
```

- TypeScriptの型エラーを検出
- すべてのファイルの型の整合性を確認

**チェック項目：**
- 型の不一致
- 存在しないプロパティへのアクセス
- Null/undefined の安全性
- 型推論の問題

### 2. Lintチェック (Lint Check)

```bash
npm run lint
```

- ESLintルールに違反していないか確認
- コードスタイルの問題を検出

**チェック項目：**
- 未使用の変数・インポート
- console.log の残留
- React Hooks のルール違反
- その他のコーディング規約違反

### 3. ビルド確認 (Build Check)

```bash
npm run build
```

- 実際にプロダクションビルドを実行
- すべてのページとコンポーネントがビルド可能か確認

**チェック項目：**
- Next.js のビルドエラー
- 依存関係の問題
- 環境変数の不足
- その他のランタイムエラー

## 実行例

### ✅ すべて成功した場合

```
✓ 型チェック完了: エラーなし
✓ Lintチェック完了: 警告なし
✓ ビルド完了: すべてのページが正常にビルドされました

✅ すべてのチェックが成功しました！
コミットして大丈夫です。
```

### ❌ エラーが見つかった場合

```
✗ 型チェック失敗: 3件のエラー
  - app/components/Button.tsx(12,5): Property 'onClick' is missing
  - lib/utils/helper.ts(45,12): Type 'string' is not assignable to type 'number'
  - types/user.ts(8,3): Cannot find name 'Profile'

詳細は docs/LINT.md を確認してください。
```

## エラー発生時の対処

### 型エラーが出た場合

1. エラーメッセージを確認
2. `docs/LINT.md` の「TypeScript型エラー」セクションを参照
3. 型定義を修正
4. 再度チェックを実行

```bash
npm run type-check
```

### Lintエラーが出た場合

1. 自動修正を試みる

```bash
npm run lint -- --fix
```

2. 手動で修正が必要なエラーを確認
3. `docs/LINT.md` の「ESLintエラー」セクションを参照
4. 修正後、再度チェックを実行

### ビルドエラーが出た場合

1. エラーメッセージを確認
2. よくある原因：
   - 環境変数の不足 → `.env.local` を確認
   - 依存関係の問題 → `npm install` を実行
   - キャッシュの問題 → `.next` フォルダを削除

```bash
rm -rf .next
npm run build
```

## クイックフィックス

### すべてのチェックを一度に実行

```bash
npm run type-check && npm run lint && npm run build
```

### 自動修正 + チェック

```bash
npm run lint -- --fix && npm run type-check && npm run build
```

### キャッシュクリア + フルチェック

```bash
rm -rf .next node_modules/.cache && npm run type-check && npm run lint && npm run build
```

## 自動化オプション

### Git Hook として設定

`.husky/pre-commit` に以下を追加：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 コミット前チェックを実行中..."

# 型チェック
echo "⚙️  型チェック中..."
npm run type-check || exit 1

# Lint
echo "🔍 Lintチェック中..."
npm run lint || exit 1

# ビルド（オプション：時間がかかる場合はコメントアウト）
# echo "🏗️  ビルド中..."
# npm run build || exit 1

echo "✅ すべてのチェックが成功しました！"
```

### VSCode タスクとして設定

`.vscode/tasks.json` に以下を追加：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Pre-build Check",
      "type": "shell",
      "command": "npm run type-check && npm run lint && npm run build",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

## ベストプラクティス

1. **頻繁にチェック**: 大きな変更の後は必ずチェック
2. **コミット前に必須**: コミット前に必ず実行
3. **CI/CD と連携**: GitHub Actions でも同じチェックを実行
4. **エラーは早期発見**: 小さな変更でも定期的にチェック

## トラブルシューティング

### チェックが遅い場合

```bash
# 型チェックのみ（最速）
npm run type-check

# Lintのみ
npm run lint

# ビルドはPR前のみに制限
```

### メモリ不足エラー

```bash
# Node.js のメモリを増やす
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### キャッシュの問題

```bash
# すべてのキャッシュをクリア
rm -rf .next node_modules/.cache
npm run build
```

## 関連ドキュメント

- [docs/LINT.md](../docs/LINT.md) - 詳細なチェックリストとエラー例
- [docs/GUIDELINE.md](../docs/GUIDELINE.md) - 開発ガイドライン
- [.cursorrules](../.cursorrules) - Cursor AI のコーディング規約

## まとめ

このコマンドを使うことで：

- ✅ ビルドエラーを未然に防げる
- ✅ コードの品質が向上する
- ✅ CI/CD でのエラーが減る
- ✅ レビューが早くなる
- ✅ 開発効率が上がる

**コミット前の習慣にしましょう！** 🚀
