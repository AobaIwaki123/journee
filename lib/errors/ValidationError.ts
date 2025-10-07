/**
 * バリデーションエラークラス
 */

import { AppError } from './AppError';

export interface ValidationErrorOptions {
  message: string;
  field?: string;
  value?: unknown;
  details?: Record<string, string[]>;
}

/**
 * バリデーション エラー
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;
  public readonly validationDetails?: Record<string, string[]>;

  constructor(options: ValidationErrorOptions) {
    super({
      code: 'VALIDATION_ERROR',
      message: options.message,
      details: options.details,
    });
    
    this.name = 'ValidationError';
    this.field = options.field;
    this.value = options.value;
    this.validationDetails = options.details;
  }

  /**
   * ユーザー向けメッセージを生成
   */
  override getUserMessage(): string {
    if (this.field) {
      return `${this.field}: ${this.message}`;
    }
    return this.message;
  }

  /**
   * ログ出力用
   */
  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
      validationDetails: this.validationDetails,
    };
  }
}