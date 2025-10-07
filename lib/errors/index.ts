/**
 * エラークラスのエクスポート
 */

export { AppError, type ErrorCode, type AppErrorOptions } from './AppError';
export { APIError, type APIErrorType, type APIErrorOptions } from './APIError';
export { ValidationError, type ValidationErrorOptions } from './ValidationError';

import { AppError } from './AppError';
import { APIError } from './APIError';
import { ValidationError } from './ValidationError';

/**
 * エラーが特定の型かチェックする型ガード
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * エラーから適切なユーザーメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.getUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '予期しないエラーが発生しました';
}