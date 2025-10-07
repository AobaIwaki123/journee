# エラーハンドリングシステム

## 概要

統一されたエラーハンドリングシステムを提供します。

## エラークラス階層

```
Error (JavaScript標準)
  └── AppError (基底クラス)
        ├── APIError (API関連)
        └── ValidationError (バリデーション)
```

## 使用方法

### APIエラー

```typescript
import { APIError } from '@/lib/errors';

throw new APIError({
  type: 'RATE_LIMIT',
  message: 'Rate limit exceeded',
  statusCode: 429,
  endpoint: '/api/chat',
});
```

### バリデーションエラー

```typescript
import { ValidationError } from '@/lib/errors';

throw new ValidationError({
  message: 'メッセージは必須です',
  field: 'message',
  value: '',
});
```

### エラーの判定

```typescript
import { isAPIError, isValidationError, getErrorMessage } from '@/lib/errors';

try {
  // 処理
} catch (error) {
  if (isAPIError(error)) {
    console.log('API error:', error.type);
  } else if (isValidationError(error)) {
    console.log('Validation error:', error.field);
  }
  
  // ユーザーメッセージを取得
  const message = getErrorMessage(error);
  showToast(message, 'error');
}
```

### ErrorBoundary

```typescript
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}

// カスタムfallback
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

## エラーコード一覧

| コード | 説明 | 使用場面 |
|--------|------|---------|
| `VALIDATION_ERROR` | バリデーションエラー | フォーム入力、データ検証 |
| `API_ERROR` | API通信エラー | 外部API呼び出し |
| `AUTHENTICATION_ERROR` | 認証エラー | ログイン、セッション |
| `AUTHORIZATION_ERROR` | 認可エラー | 権限不足 |
| `NOT_FOUND` | リソース不在 | データ取得失敗 |
| `NETWORK_ERROR` | ネットワークエラー | 通信失敗 |
| `UNKNOWN_ERROR` | 不明なエラー | その他 |

## APIエラータイプ

| タイプ | 説明 | HTTPステータス |
|--------|------|---------------|
| `RATE_LIMIT` | レート制限 | 429 |
| `INVALID_REQUEST` | 不正なリクエスト | 400 |
| `INVALID_RESPONSE` | 不正なレスポンス | 502 |
| `TIMEOUT` | タイムアウト | 408 |
| `SERVER_ERROR` | サーバーエラー | 500 |

## ベストプラクティス

### 1. 適切なエラークラスを使用
```typescript
// ❌ Bad
throw new Error('API key is required');

// ✅ Good
throw new ValidationError({
  message: 'APIキーは必須です',
  field: 'apiKey',
});
```

### 2. ユーザーフレンドリーなメッセージ
```typescript
// ❌ Bad
throw new APIError({
  type: 'SERVER_ERROR',
  message: 'Internal server error',
});

// ✅ Good
throw new APIError({
  type: 'SERVER_ERROR',
  message: 'サーバーで問題が発生しました。しばらく時間をおいて再度お試しください。',
});
```

### 3. 詳細情報の記録
```typescript
try {
  await apiCall();
} catch (error) {
  throw new APIError({
    type: 'SERVER_ERROR',
    message: 'API呼び出しに失敗しました',
    endpoint: '/api/chat',
    details: { originalError: error },
    cause: error instanceof Error ? error : undefined,
  });
}
```

## テスト

```typescript
import { describe, it, expect } from 'vitest';
import { APIError, ValidationError, isAPIError } from '@/lib/errors';

describe('APIError', () => {
  it('should create API error', () => {
    const error = new APIError({
      type: 'RATE_LIMIT',
      message: 'Too many requests',
      statusCode: 429,
    });
    
    expect(error.type).toBe('RATE_LIMIT');
    expect(error.statusCode).toBe(429);
    expect(isAPIError(error)).toBe(true);
  });
});
```