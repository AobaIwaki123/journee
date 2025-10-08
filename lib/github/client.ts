/**
 * GitHub API統合クライアント
 */

import { Octokit } from '@octokit/rest';
import type { GitHubIssuePayload } from '@/types/feedback';

export class GitHubIssueClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor() {
    // 環境変数のチェック
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not set in environment variables');
    }
    if (!process.env.GITHUB_OWNER) {
      throw new Error('GITHUB_OWNER is not set in environment variables');
    }
    if (!process.env.GITHUB_REPO) {
      throw new Error('GITHUB_REPO is not set in environment variables');
    }

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'Journee-Feedback-System/1.0'
    });
    
    this.owner = process.env.GITHUB_OWNER;
    this.repo = process.env.GITHUB_REPO;
  }

  /**
   * GitHub Issueを作成
   */
  async createIssue(payload: GitHubIssuePayload): Promise<{
    number: number;
    url: string;
  }> {
    try {
      console.log('Creating GitHub issue:', {
        owner: this.owner,
        repo: this.repo,
        title: payload.title,
        labels: payload.labels
      });

      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: payload.title,
        body: payload.body,
        labels: payload.labels,
        assignees: payload.assignees
      });

      console.log('GitHub issue created successfully:', {
        number: response.data.number,
        url: response.data.html_url
      });

      return {
        number: response.data.number,
        url: response.data.html_url
      };

    } catch (error: any) {
      console.error('GitHub API error:', {
        message: error.message,
        status: error.status,
        response: error.response?.data
      });

      if (error.status === 401) {
        throw new Error('GitHub認証に失敗しました。GITHUB_TOKENを確認してください。');
      } else if (error.status === 403) {
        throw new Error('GitHubリポジトリへのアクセス権限がありません。');
      } else if (error.status === 404) {
        throw new Error('GitHubリポジトリが見つかりません。GITHUB_OWNERとGITHUB_REPOを確認してください。');
      }

      throw new Error('GitHub Issueの作成に失敗しました: ' + error.message);
    }
  }

  /**
   * GitHub接続をテスト
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      });

      console.log('GitHub connection successful:', {
        repo: response.data.full_name,
        private: response.data.private
      });

      return true;
    } catch (error: any) {
      console.error('GitHub connection error:', {
        message: error.message,
        status: error.status
      });
      return false;
    }
  }

  /**
   * リポジトリ情報を取得
   */
  async getRepositoryInfo(): Promise<{
    name: string;
    fullName: string;
    private: boolean;
    hasIssues: boolean;
  } | null> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      });

      return {
        name: response.data.name,
        fullName: response.data.full_name,
        private: response.data.private,
        hasIssues: response.data.has_issues
      };
    } catch (error) {
      console.error('Failed to get repository info:', error);
      return null;
    }
  }

  /**
   * 利用可能なラベルを取得
   */
  async getAvailableLabels(): Promise<string[]> {
    try {
      const response = await this.octokit.rest.issues.listLabelsForRepo({
        owner: this.owner,
        repo: this.repo,
        per_page: 100
      });

      return response.data.map(label => label.name);
    } catch (error) {
      console.error('Failed to get labels:', error);
      return [];
    }
  }

  /**
   * Issueにコメントを追加
   */
  async addComment(issueNumber: number, comment: string): Promise<void> {
    try {
      await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: comment
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw new Error('コメントの追加に失敗しました');
    }
  }

  /**
   * Issueを更新
   */
  async updateIssue(
    issueNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
    }
  ): Promise<void> {
    try {
      await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates
      });
    } catch (error) {
      console.error('Failed to update issue:', error);
      throw new Error('Issueの更新に失敗しました');
    }
  }
}

/**
 * シングルトンインスタンス（オプション）
 */
let githubClientInstance: GitHubIssueClient | null = null;

export function getGitHubClient(): GitHubIssueClient {
  if (!githubClientInstance) {
    githubClientInstance = new GitHubIssueClient();
  }
  return githubClientInstance;
}
