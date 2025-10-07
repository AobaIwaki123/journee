/**
 * LocalStorageユーティリティ
 * 
 * ブラウザのLocalStorageへの安全なアクセスを提供します。
 * SSR環境でのエラーを防ぐため、windowオブジェクトの存在確認を行います。
 */

const STORAGE_KEYS = {
  CLAUDE_API_KEY: 'journee_claude_api_key',
  AI_MODEL_PREFERENCE: 'journee_ai_model_preference',
} as const;

/**
 * LocalStorageが使用可能かチェック
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * LocalStorageから値を取得
 */
export function getFromLocalStorage(key: keyof typeof STORAGE_KEYS): string | null {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    return window.localStorage.getItem(STORAGE_KEYS[key]);
  } catch (error) {
    console.error(`Failed to get item from LocalStorage (${key}):`, error);
    return null;
  }
}

/**
 * LocalStorageに値を保存
 */
export function saveToLocalStorage(key: keyof typeof STORAGE_KEYS, value: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], value);
    return true;
  } catch (error) {
    console.error(`Failed to save item to LocalStorage (${key}):`, error);
    return false;
  }
}

/**
 * LocalStorageから値を削除
 */
export function removeFromLocalStorage(key: keyof typeof STORAGE_KEYS): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    window.localStorage.removeItem(STORAGE_KEYS[key]);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from LocalStorage (${key}):`, error);
    return false;
  }
}

/**
 * LocalStorageをクリア（Journee関連のみ）
 */
export function clearJourneeLocalStorage(): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear Journee LocalStorage:', error);
    return false;
  }
}