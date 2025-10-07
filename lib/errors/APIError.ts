/**
 * API関連エラークラス
 */

import { AppError } from './AppError';

export type APIErrorType = 
  | 'RATE_LIMIT'
  | 'INVALID_REQUEST'
  | 'INVALID_RESPONSE'
  | 'TIMEOUT'
  | 'SERVER_ERROR';

export interface APIErrorOptions {
  type: APIErrorType;
  message: string;
  statusCode?: number;
  endpoint?: string;
  details?: unknown;
  cause?: Error;
}

/**
 * API エラー
 */
export class APIError extends AppError {
  public readonly type: APIErrorType;
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(options: APIErrorOptions) {
    super({
      code: 'API_ERROR',
      message: options.message,
      details: options.details,
      cause: options.cause,
    });
    
    this.name = 'APIError';
    this.type = options.type;
    this.statusCode = options.statusCode;
    this.endpoint = options.endpoint;
  }

  /**
   * ユーザー向けメッセージを生成
   */
  override getUserMessage(): string {
    switch (this.type) {
      case 'RATE_LIMIT':
        return '申し訳ございません。現在アクセスが集中しております。少し時間をおいて再度お試しください。';
      case 'INVALID_REQUEST':
        return 'リクエストの形式が正しくありません。入力内容をご確認ください。';
      case 'TIMEOUT':
        return '通信がタイムアウトしました。ネットワーク接続をご確認ください。';
      case 'SERVER_ERROR':
        return 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。';
      default:
        return this.message;
    }
  }

  /**
   * ログ出力用
   */
  override toJSON() {
    return {
      ...super.toJSON(),
      type: this.type,
      statusCode: this.statusCode,
      endpoint: this.endpoint,
    };
  }
}