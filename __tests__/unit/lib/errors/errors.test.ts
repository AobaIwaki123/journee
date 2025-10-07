import { describe, it, expect } from 'vitest';
import {
  AppError,
  APIError,
  ValidationError,
  isAppError,
  isAPIError,
  isValidationError,
  getErrorMessage,
} from '@/lib/errors';

describe('AppError', () => {
  it('should create app error with required fields', () => {
    const error = new AppError({
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('Something went wrong');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should include optional details', () => {
    const details = { userId: '123', action: 'create' };
    const error = new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details,
    });

    expect(error.details).toEqual(details);
  });

  it('should include cause error', () => {
    const cause = new Error('Original error');
    const error = new AppError({
      code: 'UNKNOWN_ERROR',
      message: 'Wrapped error',
      cause,
    });

    expect(error.cause).toBe(cause);
  });

  it('should serialize to JSON', () => {
    const error = new AppError({
      code: 'API_ERROR',
      message: 'Test error',
    });

    const json = error.toJSON();

    expect(json).toHaveProperty('name', 'AppError');
    expect(json).toHaveProperty('code', 'API_ERROR');
    expect(json).toHaveProperty('message', 'Test error');
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('stack');
  });
});

describe('APIError', () => {
  it('should create API error with type and status code', () => {
    const error = new APIError({
      type: 'RATE_LIMIT',
      message: 'Too many requests',
      statusCode: 429,
      endpoint: '/api/chat',
    });

    expect(error).toBeInstanceOf(APIError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.type).toBe('RATE_LIMIT');
    expect(error.statusCode).toBe(429);
    expect(error.endpoint).toBe('/api/chat');
    expect(error.code).toBe('API_ERROR');
  });

  it('should provide user-friendly message for RATE_LIMIT', () => {
    const error = new APIError({
      type: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
    });

    expect(error.getUserMessage()).toContain('アクセスが集中');
  });

  it('should provide user-friendly message for TIMEOUT', () => {
    const error = new APIError({
      type: 'TIMEOUT',
      message: 'Request timeout',
    });

    expect(error.getUserMessage()).toContain('タイムアウト');
  });

  it('should serialize with API-specific fields', () => {
    const error = new APIError({
      type: 'SERVER_ERROR',
      message: 'Internal error',
      statusCode: 500,
      endpoint: '/api/test',
    });

    const json = error.toJSON();

    expect(json).toHaveProperty('type', 'SERVER_ERROR');
    expect(json).toHaveProperty('statusCode', 500);
    expect(json).toHaveProperty('endpoint', '/api/test');
  });
});

describe('ValidationError', () => {
  it('should create validation error with field', () => {
    const error = new ValidationError({
      message: 'Required field',
      field: 'email',
      value: '',
    });

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.field).toBe('email');
    expect(error.value).toBe('');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should include field name in user message', () => {
    const error = new ValidationError({
      message: 'は必須項目です',
      field: 'メールアドレス',
    });

    expect(error.getUserMessage()).toBe('メールアドレス: は必須項目です');
  });

  it('should handle validation details', () => {
    const details = {
      email: ['Invalid format', 'Already exists'],
      password: ['Too short'],
    };

    const error = new ValidationError({
      message: 'Multiple validation errors',
      details,
    });

    expect(error.validationDetails).toEqual(details);
  });
});

describe('Error type guards', () => {
  it('should identify AppError', () => {
    const appError = new AppError({ code: 'UNKNOWN_ERROR', message: 'test' });
    const normalError = new Error('test');

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(normalError)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  it('should identify APIError', () => {
    const apiError = new APIError({ type: 'TIMEOUT', message: 'test' });
    const appError = new AppError({ code: 'UNKNOWN_ERROR', message: 'test' });

    expect(isAPIError(apiError)).toBe(true);
    expect(isAPIError(appError)).toBe(false);
  });

  it('should identify ValidationError', () => {
    const validationError = new ValidationError({ message: 'test' });
    const apiError = new APIError({ type: 'TIMEOUT', message: 'test' });

    expect(isValidationError(validationError)).toBe(true);
    expect(isValidationError(apiError)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should get message from AppError', () => {
    const error = new AppError({
      code: 'API_ERROR',
      message: 'Custom error message',
    });

    expect(getErrorMessage(error)).toBe('Custom error message');
  });

  it('should get user message from APIError', () => {
    const error = new APIError({
      type: 'RATE_LIMIT',
      message: 'Internal message',
    });

    expect(getErrorMessage(error)).toContain('アクセスが集中');
  });

  it('should get message from standard Error', () => {
    const error = new Error('Standard error');

    expect(getErrorMessage(error)).toBe('Standard error');
  });

  it('should return default message for unknown errors', () => {
    expect(getErrorMessage('string')).toBe('予期しないエラーが発生しました');
    expect(getErrorMessage(null)).toBe('予期しないエラーが発生しました');
    expect(getErrorMessage({})).toBe('予期しないエラーが発生しました');
  });
});