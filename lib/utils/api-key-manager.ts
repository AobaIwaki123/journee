/**
 * APIキー管理（サーバー経由）
 * Claude APIキーをSupabaseで安全に管理
 */

/**
 * Claude APIキーを保存
 */
export async function saveClaudeApiKey(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const response = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, provider: 'claude' }),
    });

    if (!response.ok) {
      console.error('Failed to save API key:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to save API key:', error);
    return false;
  }
}

/**
 * Claude APIキーを取得
 */
export async function loadClaudeApiKey(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const response = await fetch('/api/user/api-keys', {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to load API key:', response.statusText);
      return '';
    }

    const data = await response.json();
    return data.apiKey || '';
  } catch (error) {
    console.error('Failed to load API key:', error);
    return '';
  }
}

/**
 * Claude APIキーを削除
 */
export async function removeClaudeApiKey(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const response = await fetch('/api/user/api-keys', {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Failed to remove API key:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Failed to remove API key:', error);
    return false;
  }
}

/**
 * Claude APIキーが設定されているか確認
 */
export async function hasClaudeApiKey(): Promise<boolean> {
  const apiKey = await loadClaudeApiKey();
  return apiKey.length > 0;
}
