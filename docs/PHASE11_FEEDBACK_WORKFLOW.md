# Phase 11: ユーザーフィードバック & 自動Issue/PR作成ワークフロー

## 📋 概要

**目的**: ユーザーからの機能要望や改善提案を受け取り、LLMで構造化してGitHub Issueに自動投稿し、Cursorを活用して自動的にPull Requestを作成する開発ワークフローの確立

**実装期間**: Week 20-22（Phase 10デプロイ後）

**優先度**: Medium（運用効率化・開発速度向上）

---

## 🎯 実装目標

1. **ユーザーフィードバックの収集**: アプリ内フォームからユーザーの要望を受け取る
2. **LLMによる構造化**: ユーザーの自由記述をLLMで解析し、Issue用のプロンプトに変換
3. **GitHub Issue自動作成**: 構造化されたデータを基にGitHub Issueを自動投稿
4. **Cursor自動PR生成**: Issueを監視し、Cursorを使ってPRを自動作成するワークフロー構築

---

## 🏗 システムアーキテクチャ

### データフロー

```
┌─────────────────────────────────────────────────────────────────┐
│                        ユーザーアクション                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: ユーザーフィードバックフォーム                              │
│  - フォーム表示（アプリ内モーダル）                                  │
│  - カテゴリー選択（機能追加/バグ報告/UI改善/その他）                  │
│  - 自由記述入力（要望の詳細）                                       │
│  - スクリーンショット添付（オプション）                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: LLMによる構造化（Gemini/Claude API）                      │
│  - ユーザー入力をパース                                            │
│  - Issue用のタイトル生成                                           │
│  - Issue用の本文生成（テンプレート形式）                             │
│    - 機能概要                                                     │
│    - 実装要件                                                     │
│    - 期待される効果                                                │
│    - 関連ファイル候補                                              │
│    - 優先度推定                                                   │
│  - ラベル候補の提案（enhancement/bug/UI/UX等）                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: GitHub Issue自動作成                                    │
│  - GitHub API（Octokit）を使用                                    │
│  - リポジトリにIssueを投稿                                         │
│  - ラベル自動付与                                                  │
│  - プロジェクトボードに追加（オプション）                             │
│  - ユーザーに投稿完了通知                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: GitHub Actions - Issue監視                              │
│  - 新しいIssueが作成されたらトリガー                                │
│  - Issueラベルに基づいてワークフロー選択                             │
│  - CursorのGitHub統合を利用してPR作成リクエスト                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Cursor自動PR作成                                        │
│  - CursorのAI Editorモードを利用                                  │
│  - Issueの内容を解析し、必要なコード変更を実装                       │
│  - PRを自動作成                                                   │
│    - PR本文にIssueへのリンク                                       │
│    - 変更内容のサマリー                                            │
│    - テスト計画                                                   │
│  - レビュー担当者に通知                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 実装フェーズ

### Phase 11.1: フィードバックフォームUI実装

#### 11.1.1 コンポーネント設計

**目的**: ユーザーが簡単にフィードバックを送信できるUIを構築

##### 実装内容

- [ ] フィードバックフォームコンポーネントの作成
  - [ ] `components/feedback/FeedbackModal.tsx`
    - [ ] モーダル表示・非表示制御
    - [ ] カテゴリー選択（ドロップダウン）
      - [ ] 🆕 機能追加（feature）
      - [ ] 🐛 バグ報告（bug）
      - [ ] 🎨 UI/UX改善（UI）
      - [ ] 📝 ドキュメント（documentation）
      - [ ] ⚡ パフォーマンス改善（performance）
      - [ ] 🔒 セキュリティ（security）
      - [ ] ❓ その他（other）
    - [ ] タイトル入力フォーム（必須）
    - [ ] 詳細入力フォーム（textarea、必須）
    - [ ] スクリーンショット添付機能（オプション）
    - [ ] プライオリティ選択（低/中/高、オプション）
    - [ ] 送信ボタン（バリデーション付き）
    - [ ] キャンセルボタン
  - [ ] `components/feedback/FeedbackButton.tsx`
    - [ ] ヘッダーまたはサイドバーに配置する固定ボタン
    - [ ] アイコン: 💬 または 📝
    - [ ] ホバー時のツールチップ表示
    - [ ] クリックでモーダルを開く

- [ ] Zustand状態管理の拡張
  - [ ] `lib/store/useStore.ts` に追加
    - [ ] `feedbackModalOpen: boolean`
    - [ ] `openFeedbackModal()`, `closeFeedbackModal()`

- [ ] バリデーション実装
  - [ ] Zod スキーマの作成（`types/feedback.ts`）
    - [ ] `FeedbackFormSchema`
      - [ ] category: enum（feature/bug/UI等）
      - [ ] title: string（1-100文字）
      - [ ] description: string（10-2000文字）
      - [ ] screenshot?: File（画像のみ、5MB以下）
      - [ ] priority?: enum（low/medium/high）
  - [ ] React Hook Form統合（`react-hook-form` + `@hookform/resolvers`）

- [ ] アクセシビリティ対応
  - [ ] キーボード操作対応（Tab、Enter、Esc）
  - [ ] ARIA属性の追加
  - [ ] フォーカス管理（モーダルオープン時）

**期待される効果**:
- ユーザーが簡単にフィードバックを送信できる
- フォーム入力のミスを防ぐバリデーション
- スクリーンショットで視覚的な説明が可能

---

### Phase 11.2: LLM構造化エンジン実装

#### 11.2.1 プロンプトエンジニアリング

**目的**: ユーザーの自由記述をGitHub Issue用の構造化されたフォーマットに変換

##### 実装内容

- [ ] LLMプロンプト設計
  - [ ] `lib/feedback/prompts.ts` の作成
    - [ ] `FEEDBACK_ANALYSIS_PROMPT`: ユーザー入力を解析するプロンプト
      ```typescript
      /**
       * ユーザーフィードバックを解析し、GitHub Issue用のフォーマットに変換するプロンプト
       * 
       * 入力:
       * - category: ユーザーが選択したカテゴリー
       * - title: ユーザーが入力したタイトル
       * - description: ユーザーが入力した詳細
       * 
       * 出力: JSON形式
       * {
       *   "issueTitle": "明確で簡潔なIssueタイトル",
       *   "issueBody": "マークダウン形式の本文",
       *   "labels": ["enhancement", "UI"],
       *   "priority": "medium",
       *   "estimatedComplexity": "medium",
       *   "relatedFiles": ["components/chat/MessageInput.tsx"],
       *   "implementationSteps": ["ステップ1", "ステップ2"]
       * }
       */
      ```
    - [ ] カテゴリー別のプロンプトテンプレート
      - [ ] 機能追加: ユーザーストーリー形式に変換
      - [ ] バグ報告: 再現手順を明確化
      - [ ] UI改善: Before/Afterを構造化
      - [ ] その他: 適切なフォーマットを推測

- [ ] LLM API統合
  - [ ] `lib/feedback/analyzer.ts` の作成
    - [ ] `analyzeFeedback()` 関数
      ```typescript
      export async function analyzeFeedback(input: {
        category: FeedbackCategory;
        title: string;
        description: string;
        priority?: Priority;
      }): Promise<AnalyzedFeedback> {
        // Gemini/Claude APIを呼び出し
        // プロンプトを使ってユーザー入力を構造化
        // JSONレスポンスをパース
        // エラーハンドリング
      }
      ```
    - [ ] レスポンスパース処理
    - [ ] エラーハンドリング（LLM API障害時のフォールバック）

- [ ] 型定義の作成
  - [ ] `types/feedback.ts`
    ```typescript
    export type FeedbackCategory = 
      | 'feature' 
      | 'bug' 
      | 'UI' 
      | 'documentation' 
      | 'performance' 
      | 'security' 
      | 'other';

    export type Priority = 'low' | 'medium' | 'high';

    export interface FeedbackFormData {
      category: FeedbackCategory;
      title: string;
      description: string;
      screenshot?: File;
      priority?: Priority;
    }

    export interface AnalyzedFeedback {
      issueTitle: string;
      issueBody: string; // Markdown形式
      labels: string[];
      priority: Priority;
      estimatedComplexity?: 'low' | 'medium' | 'high';
      relatedFiles?: string[];
      implementationSteps?: string[];
    }
    ```

**期待される効果**:
- ユーザーの曖昧な要望を明確な要件に変換
- Issue作成の手間を削減
- 開発者が理解しやすいフォーマットに標準化

---

### Phase 11.3: GitHub Issue自動作成API実装

#### 11.3.1 GitHub API統合

**目的**: 構造化されたフィードバックをGitHub Issueとして自動投稿

##### 実装内容

- [ ] GitHub API統合
  - [ ] `@octokit/rest` パッケージのインストール
    ```bash
    npm install @octokit/rest
    ```
  - [ ] `lib/github/client.ts` の作成
    ```typescript
    import { Octokit } from '@octokit/rest';

    export const githubClient = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    export async function createIssue(data: {
      title: string;
      body: string;
      labels: string[];
    }) {
      const { data: issue } = await githubClient.issues.create({
        owner: process.env.GITHUB_REPO_OWNER || 'your-org',
        repo: process.env.GITHUB_REPO_NAME || 'journee',
        title: data.title,
        body: data.body,
        labels: data.labels,
      });
      return issue;
    }
    ```

- [ ] APIエンドポイント実装
  - [ ] `app/api/feedback/submit/route.ts` の作成
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { analyzeFeedback } from '@/lib/feedback/analyzer';
    import { createIssue } from '@/lib/github/client';
    import { getCurrentUser } from '@/lib/auth/session';

    export async function POST(req: NextRequest) {
      try {
        // 認証チェック
        const user = await getCurrentUser();
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        // リクエストボディをパース
        const formData = await req.json();

        // LLMで構造化
        const analyzed = await analyzeFeedback(formData);

        // GitHub Issueを作成
        const issue = await createIssue({
          title: analyzed.issueTitle,
          body: `
## 📝 フィードバック情報

**提出者**: ${user.name || user.email}
**カテゴリー**: ${formData.category}
**優先度**: ${analyzed.priority}

---

${analyzed.issueBody}

---

## 🔍 AI分析結果

**推定複雑度**: ${analyzed.estimatedComplexity || 'N/A'}

**関連ファイル候補**:
${analyzed.relatedFiles?.map(f => `- \`${f}\``).join('\n') || 'なし'}

**実装ステップ**:
${analyzed.implementationSteps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'なし'}
          `,
          labels: analyzed.labels,
        });

        return NextResponse.json({
          success: true,
          issueNumber: issue.number,
          issueUrl: issue.html_url,
        });
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        return NextResponse.json(
          { error: 'Failed to submit feedback' },
          { status: 500 }
        );
      }
    }
    ```

- [ ] スクリーンショット処理
  - [ ] `lib/utils/upload.ts` の作成
    - [ ] 画像をBase64エンコード
    - [ ] GitHub Issueに画像を埋め込む（オプション）
    - [ ] または外部ストレージ（Cloudinary、S3等）にアップロードしてリンクを埋め込む

- [ ] 環境変数の追加
  - [ ] `.env.local`
    ```env
    # GitHub Integration
    GITHUB_TOKEN=ghp_your_github_personal_access_token
    GITHUB_REPO_OWNER=your-username-or-org
    GITHUB_REPO_NAME=journee
    ```
  - [ ] GitHub Personal Access Tokenの作成
    - [ ] Scopes: `repo` (すべて)

- [ ] エラーハンドリング
  - [ ] GitHub API レート制限対応
  - [ ] ネットワークエラー時のリトライ
  - [ ] ユーザーへのエラー通知

**期待される効果**:
- ユーザーフィードバックが自動的にGitHub Issueに変換される
- 開発者はGitHubで一元管理できる
- フィードバックの追跡が容易になる

---

### Phase 11.4: GitHub Actions - Issue監視ワークフロー

#### 11.4.1 GitHub Actionsワークフローの構築

**目的**: 新しいIssueが作成されたらCursorでの自動PR作成をトリガー

##### 実装内容

- [ ] GitHub Actionsワークフローの作成
  - [ ] `.github/workflows/auto-issue-handler.yml` の作成
    ```yaml
    name: Auto Issue Handler

    on:
      issues:
        types: [opened, labeled]

    jobs:
      notify-cursor:
        runs-on: ubuntu-latest
        if: contains(github.event.issue.labels.*.name, 'auto-implement')
        
        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Notify Cursor AI
            run: |
              echo "New issue created: #${{ github.event.issue.number }}"
              echo "Title: ${{ github.event.issue.title }}"
              echo "Labels: ${{ join(github.event.issue.labels.*.name, ', ') }}"
              
              # Cursorへの通知（Webhook、Slack、Discord等）
              # ここではSlack通知の例
              curl -X POST ${{ secrets.CURSOR_WEBHOOK_URL }} \
                -H 'Content-Type: application/json' \
                -d '{
                  "issue_number": "${{ github.event.issue.number }}",
                  "issue_title": "${{ github.event.issue.title }}",
                  "issue_url": "${{ github.event.issue.html_url }}",
                  "labels": "${{ join(github.event.issue.labels.*.name, ', ') }}"
                }'

          - name: Add comment to issue
            uses: actions/github-script@v7
            with:
              script: |
                github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: context.issue.number,
                  body: '🤖 **自動処理開始**\n\nこのIssueはCursorで自動実装の対象としてマークされました。\n\nPRが作成されるまでしばらくお待ちください。'
                });
    ```

- [ ] ラベルベースのフィルタリング
  - [ ] `auto-implement` ラベルが付いたIssueのみを対象
  - [ ] カテゴリー別の処理分岐
    - [ ] `bug`: バグ修正ワークフロー
    - [ ] `enhancement`: 機能追加ワークフロー
    - [ ] `UI`: UI改善ワークフロー

- [ ] Webhook/通知設定
  - [ ] Slack統合（オプション）
    - [ ] 新しいIssueが作成されたらSlackに通知
    - [ ] 開発者がCursorでPR作成を開始できる
  - [ ] Discord統合（オプション）
  - [ ] メール通知（オプション）

**期待される効果**:
- 新しいIssueが自動的に検出される
- 開発者に即座に通知される
- ラベルベースで優先度の高いIssueを自動処理できる

---

### Phase 11.5: Cursor自動PR作成ワークフロー

#### 11.5.1 Cursor統合の設計

**目的**: Issueの内容を基にCursorのAI機能を活用してPRを自動作成

##### 実装方法（2つのアプローチ）

#### アプローチ A: Cursorマニュアル実行（推奨）

**Cursorの現在の制約**:
- Cursorは完全自動でPRを作成する公式APIを提供していない
- 開発者がCursorを起動し、AI機能を使ってコードを編集する必要がある

**ワークフロー**:

1. **Issue通知を受け取る**
   - GitHub ActionsからSlack/Discord/メールで通知
   - 開発者がIssueの内容を確認

2. **Cursorで作業開始**
   - 開発者がCursorを起動
   - Issueの内容をCursorのAIチャットにコピー
   - 以下のようなプロンプトを使用:
     ```
     以下のGitHub Issueを実装してください:

     Issue #123: [タイトル]
     [Issue本文]

     実装要件:
     - [要件1]
     - [要件2]

     関連ファイル:
     - components/chat/MessageInput.tsx
     - lib/store/useStore.ts

     実装後、テストして動作確認してください。
     ```

3. **Cursorで実装**
   - CursorのAI機能を使ってコードを編集
   - テスト実行
   - コミット作成

4. **PR作成**
   - CursorのGitHub統合を使ってPRを作成
   - または手動で `gh pr create` コマンド実行

**メリット**:
- 現在のCursor機能で実現可能
- 開発者が品質をチェックできる
- 複雑な実装も柔軟に対応

**デメリット**:
- 完全自動化ではない
- 開発者の手動操作が必要

---

#### アプローチ B: スクリプトベース半自動化（将来的）

**目的**: GitHub CLI + Cursor Rulesを使って半自動化

**実装内容**:

- [ ] Cursorルールの作成
  - [ ] `.cursor/rules/auto-implement.mdc` の作成
    ```markdown
    # Auto-Implementation Rule

    When implementing a GitHub Issue:

    1. Read the issue description carefully
    2. Identify the files that need to be changed
    3. Make the necessary code changes
    4. Ensure all tests pass
    5. Create a commit with the message: "Implement #[issue-number]: [title]"
    6. Create a PR with the following template:

    ## Summary
    Resolves #[issue-number]

    [Brief description of changes]

    ## Changes
    - [Change 1]
    - [Change 2]

    ## Test Plan
    - [Test 1]
    - [Test 2]
    ```

- [ ] シェルスクリプトの作成
  - [ ] `scripts/auto-implement.sh` の作成
    ```bash
    #!/bin/bash
    
    ISSUE_NUMBER=$1
    
    if [ -z "$ISSUE_NUMBER" ]; then
      echo "Usage: ./scripts/auto-implement.sh <issue-number>"
      exit 1
    fi
    
    # Issueの内容を取得
    ISSUE_DATA=$(gh issue view $ISSUE_NUMBER --json title,body,labels)
    ISSUE_TITLE=$(echo $ISSUE_DATA | jq -r '.title')
    ISSUE_BODY=$(echo $ISSUE_DATA | jq -r '.body')
    
    echo "Implementing Issue #$ISSUE_NUMBER: $ISSUE_TITLE"
    
    # ブランチ作成
    BRANCH_NAME="issue-$ISSUE_NUMBER-$(echo $ISSUE_TITLE | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-50)"
    git checkout -b $BRANCH_NAME
    
    # CursorのAIチャットにプロンプトを送信（手動）
    echo "Open Cursor and use the following prompt:"
    echo "---"
    echo "Implement the following GitHub Issue:"
    echo ""
    echo "Issue #$ISSUE_NUMBER: $ISSUE_TITLE"
    echo ""
    echo "$ISSUE_BODY"
    echo "---"
    
    # 開発者がCursorで実装
    read -p "Press Enter after implementation is complete..."
    
    # コミット
    git add .
    git commit -m "Implement #$ISSUE_NUMBER: $ISSUE_TITLE"
    
    # PRの作成
    gh pr create --title "Implement #$ISSUE_NUMBER: $ISSUE_TITLE" \
      --body "Resolves #$ISSUE_NUMBER

    $(echo $ISSUE_BODY)

    ## Changes
    - Implemented the requested feature

    ## Test Plan
    - Manual testing performed
    - All existing tests pass"
    
    echo "PR created successfully!"
    ```

**メリット**:
- 一部自動化が可能
- GitHub CLIとの統合

**デメリット**:
- 依然として開発者の操作が必要
- Cursor APIが公式に提供されていないため、完全自動化は不可能

---

### Phase 11.6: ユーザーへのフィードバック通知

#### 11.6.1 通知システムの実装

**目的**: ユーザーに進捗状況を通知し、透明性を確保

##### 実装内容

- [ ] フィードバック送信完了画面
  - [ ] `components/feedback/FeedbackSuccess.tsx`
    - [ ] Issue番号とURLを表示
    - [ ] 「GitHubで確認」ボタン
    - [ ] 「別のフィードバックを送信」ボタン

- [ ] メール通知（オプション）
  - [ ] SendGrid、Resendなどのメールサービス統合
  - [ ] Issue作成時にユーザーにメール送信
  - [ ] PR作成時にユーザーにメール送信

- [ ] アプリ内通知（Phase 12で実装予定）
  - [ ] 通知センター機能
  - [ ] リアルタイム通知（WebSocket）

**期待される効果**:
- ユーザーは自分のフィードバックの進捗を追跡できる
- 開発への参加意識が向上
- コミュニティとのエンゲージメント強化

---

## 🧪 テスト計画

### 11.1 ユニットテスト

- [ ] LLM構造化エンジンのテスト
  - [ ] `lib/feedback/analyzer.test.ts`
    - [ ] 各カテゴリーごとの正しい構造化
    - [ ] エッジケース（空文字、長文、特殊文字）
    - [ ] LLM APIエラー時のフォールバック

- [ ] GitHub API統合のテスト
  - [ ] `lib/github/client.test.ts`
    - [ ] Issue作成のモックテスト
    - [ ] レート制限対応のテスト

### 11.2 統合テスト

- [ ] フィードバック送信フロー全体のテスト
  - [ ] フォーム入力 → LLM構造化 → GitHub Issue作成
  - [ ] エラーハンドリング
  - [ ] 通知送信

### 11.3 E2Eテスト（Playwright）

- [ ] ユーザーフィードバック送信の完全フロー
  - [ ] フォーム入力
  - [ ] 送信ボタンクリック
  - [ ] 成功画面表示
  - [ ] GitHub Issueが作成されたことを確認

---

## 📊 成功指標（KPI）

### 定量的指標

- **フィードバック送信数**: 月間50件以上
- **Issue作成成功率**: 95%以上
- **LLM構造化精度**: 80%以上（手動レビューで判定）
- **PR作成時間**: Issue作成から24時間以内
- **ユーザー満足度**: フィードバック送信後のアンケートで4.0/5.0以上

### 定性的指標

- ユーザーが気軽にフィードバックを送信できる
- 開発者の作業効率が向上する
- Issue品質が向上する（曖昧な要望が減る）

---

## 🔒 セキュリティ考慮事項

### 11.1 認証・認可

- [ ] フィードバック送信は認証済みユーザーのみ
- [ ] スパム対策
  - [ ] レート制限（1ユーザーあたり1時間に5件まで）
  - [ ] reCAPTCHA統合（オプション）

### 11.2 データ検証

- [ ] ユーザー入力のサニタイゼーション
- [ ] XSS対策（マークダウンレンダリング時）
- [ ] SQLインジェクション対策（DB使用時）

### 11.3 APIキー管理

- [ ] GitHub Tokenは環境変数で管理
- [ ] 最小権限の原則（`repo`スコープのみ）
- [ ] トークンの定期的なローテーション

---

## 💰 コスト見積もり

### LLM API コスト

- **Gemini API**: 無料枠内で対応可能（月間1,000リクエスト程度）
- **Claude API**: 使用する場合、月額$20-50程度

### GitHub API

- **無料**: GitHub APIは無料で利用可能（レート制限: 5,000リクエスト/時）

### その他

- **画像ストレージ**: Cloudinary無料枠（25クレジット/月）またはGitHub自体に埋め込み

**合計**: 月額$0-50程度

---

## 📚 関連ドキュメント

- [GitHub API ドキュメント](https://docs.github.com/en/rest)
- [Octokit.js](https://github.com/octokit/octokit.js)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Cursor ドキュメント](https://cursor.sh/docs)

---

## 🚀 ロードマップ

### 短期（Phase 11実装時）

- ✅ フィードバックフォームUI
- ✅ LLM構造化エンジン
- ✅ GitHub Issue自動作成
- ✅ GitHub Actions監視ワークフロー
- ✅ Cursorマニュアル実装ワークフロー

### 中期（Phase 12-13）

- [ ] 通知システムの強化
- [ ] アプリ内通知センター
- [ ] フィードバック分析ダッシュボード
- [ ] 自動テスト生成（Cursorで実装されたコードに対して）

### 長期（Phase 14+）

- [ ] Cursor公式APIが提供されたら完全自動化
- [ ] AIによるコードレビュー自動化
- [ ] デプロイ前の自動E2Eテスト
- [ ] ユーザー投票システム（人気の高いフィードバックを優先実装）

---

## 🎓 学習リソース

### GitHub API

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Octokit.js Tutorial](https://github.com/octokit/octokit.js#readme)

### GitHub Actions

- [GitHub Actions Quickstart](https://docs.github.com/en/actions/quickstart)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### LLMプロンプトエンジニアリング

- [Gemini API Prompt Guide](https://ai.google.dev/docs/prompt_best_practices)
- [Claude Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)

---

## ✅ 実装チェックリスト

### Phase 11.1: フィードバックフォームUI
- [ ] `FeedbackModal.tsx` 実装
- [ ] `FeedbackButton.tsx` 実装
- [ ] Zustand状態管理拡張
- [ ] バリデーション実装
- [ ] アクセシビリティ対応

### Phase 11.2: LLM構造化エンジン
- [ ] `lib/feedback/prompts.ts` 作成
- [ ] `lib/feedback/analyzer.ts` 作成
- [ ] 型定義（`types/feedback.ts`）
- [ ] ユニットテスト作成

### Phase 11.3: GitHub Issue自動作成
- [ ] `@octokit/rest` インストール
- [ ] `lib/github/client.ts` 作成
- [ ] `app/api/feedback/submit/route.ts` 作成
- [ ] スクリーンショット処理
- [ ] 環境変数設定
- [ ] エラーハンドリング

### Phase 11.4: GitHub Actions監視
- [ ] `.github/workflows/auto-issue-handler.yml` 作成
- [ ] ラベルフィルタリング実装
- [ ] Webhook/通知設定

### Phase 11.5: Cursor自動PR作成
- [ ] Cursorルール作成（`.cursor/rules/auto-implement.mdc`）
- [ ] 半自動化スクリプト作成（`scripts/auto-implement.sh`）
- [ ] ワークフロー文書化

### Phase 11.6: 通知システム
- [ ] `FeedbackSuccess.tsx` 実装
- [ ] メール通知（オプション）
- [ ] アプリ内通知（Phase 12予定）

### テスト
- [ ] ユニットテスト作成
- [ ] 統合テスト作成
- [ ] E2Eテスト作成

### ドキュメント
- [ ] API仕様書更新
- [ ] ユーザーガイド作成
- [ ] 開発者向けドキュメント作成

---

## 🎉 期待される効果まとめ

1. **ユーザーエンゲージメント向上**
   - ユーザーが機能要望を簡単に送信できる
   - フィードバックが実装される透明性

2. **開発効率向上**
   - Issue作成の手間が削減
   - 構造化されたIssueで実装が容易

3. **プロダクト品質向上**
   - ユーザーの声を素早く反映
   - バグ報告の迅速な対応

4. **開発プロセスの自動化**
   - GitHub ActionsとCursorの連携
   - PR作成時間の短縮

---

**実装開始日**: Phase 10完了後（Week 20）
**実装完了予定日**: Week 22
**責任者**: 開発チーム
**優先度**: Medium