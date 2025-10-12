# Pre-commit Check Command

コミット前に必須のチェック（型チェック + Lint）を実行します。Push前は @pre-build-check を使ってビルドまで確認してください。

## 実行

```
@pre-commit-check
```

## 実施内容

1. TypeScript 型チェック
   - `npm run type-check`
2. ESLint チェック
   - `npm run lint`

## 期待する結果
- 型エラー・Lintエラーが0であること
- エラーがあれば修正方針を提示し、再実行を促す

## 備考
- Push前は以下の完全版を実行してください
  - `@pre-build-check`（型・Lint・ビルド）
