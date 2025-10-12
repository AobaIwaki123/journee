<!-- 1b0b02b3-6ce7-4854-a632-9caa87a7c0c9 950ecdc1-17f7-4772-ad64-3be25e253790 -->
# IssueからPR作成時のルールとテンプレート作成

## 作成するファイル

### 1. Cursor Rule: `.cursor/rules/pr-from-issue.mdc`

- **目的**: IssueからPRを作成する際の指示を明確化
- **内容**:
- Issue番号を必ずPR説明に含める（`Closes #123`形式）
- Issueの目的・背景をPR説明に含める
- 実装した変更内容を具体的に記載
- テスト結果やスクリーンショットを添付
- PR templateに従った記述
- **適用**: `alwaysApply: true`で常時適用

### 2. GitHub PR Template: `.github/pull_request_template.md`

- **目的**: PRの標準フォーマットを定義
- **セクション**:
- 関連Issue（`Closes #`, `Fixes #`, `Relates to #`）
- 変更内容の概要
- 変更の種類（機能追加、バグ修正、リファクタリングなど）
- 実装の詳細
- テスト方法
- チェックリスト（ビルド確認、テスト実行、ドキュメント更新など）
- スクリーンショット（該当する場合）

## 既存ファイルとの連携

- `.cursor/commands/`の既存コマンドとの整合性を保つ
- `docs/GUIDELINE.md`に記載されている開発プロセスに準拠
- `pre-build-check`ルールとの連携（チェックリスト項目）

## 注意点

- GitHub標準のPR template配置場所（`.github/pull_request_template.md`）を使用
- Markdownフォーマットで読みやすく構造化
- 必須項目と任意項目を明確に区別

### To-dos

- [ ] Cursor rule `.cursor/rules/pr-from-issue.mdc`を作成し、IssueからPR作成時の指示を記載
- [ ] `.github`ディレクトリが存在しない場合は作成
- [ ] PR template `.github/pull_request_template.md`を作成し、標準フォーマットを定義