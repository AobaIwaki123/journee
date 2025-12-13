/**
 * GitHub API クライアント
 * フィードバックをGitHub Issueとして登録する
 */

import type { GitHubIssueRequest, GitHubIssueResponse } from '@/types/feedback';

/**
 * GitHub API設定
 */
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'your-github-username';
const GITHUB_REPO = process.env.GITHUB_REPO || 'journee';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * GitHub Issueを作成する
 */
export async function createGitHubIssue(
  request: GitHubIssueRequest
): Promise<GitHubIssueResponse> {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub Personal Access Token is not configured');
  }

  const url = `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: request.title,
      body: request.body,
      labels: request.labels,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('GitHub API error:', errorData);
    throw new Error(
      `Failed to create GitHub issue: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    html_url: data.html_url,
    number: data.number,
  };
}

/**
 * フィードバックのテンプレートを生成する
 */
export function generateFeedbackTemplate(params: {
  category: string;
  description: string;
  userEmail?: string;
  userName?: string;
  userAgent?: string;
  url?: string;
}): string {
  const {
    category,
    description,
    userAgent,
    url,
  } = params;

  const timestamp = new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
  });

  let template = `## フィードバック

**カテゴリ**: ${category}  
**日時**: ${timestamp}

### 内容

${description}

---

### 環境情報

`;

  if (userAgent) {
    template += `- User Agent: \`${userAgent}\`\n`;
  }

  if (url) {
    template += `- URL: ${url}\n`;
  }

  template += `
---

_このIssueはJourneeアプリのフィードバック機能から自動生成されました。_
`;

  return template;
}

/**
 * GitHub API の設定が正しいかチェックする
 */
export function isGitHubConfigured(): boolean {
  return !!(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO);
}

/**
 * GitHub リポジトリのURL
 */
export function getRepositoryUrl(): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
}
