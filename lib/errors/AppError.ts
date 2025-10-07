/**
 * アプリケーション基底エラークラス
 */

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'API_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  details?: unknown;
  cause?: Error;
}

/**
 * アプリケーション共通エラークラス
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: Date;
  public readonly cause?: Error;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
    this.timestamp = new Date();

    // エラースタックトレースを保持
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * ユーザー向けのエラーメッセージを取得
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * ログ出力用の詳細情報を取得
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}