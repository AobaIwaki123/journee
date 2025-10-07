/**
 * LocalStorageヘルパー
 * ブラウザのLocalStorageへの安全なアクセスを提供
 */

import { encrypt, decrypt } from './encryption';

// LocalStorageキー
const STORAGE_KEYS = {
  CLAUDE_API_KEY: 'journee_claude_api_key',
  SELECTED_AI: 'journee_selected_ai',
  PANEL_WIDTH: 'journee_panel_width', // Phase 7用
} as const;

/**
 * LocalStorageが利用可能かチェック
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Claude APIキーを暗号化して保存
 */
export function saveClaudeApiKey(apiKey: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('LocalStorage is not available');
    return false;
  }
  
  try {
    const encrypted = encrypt(apiKey);
    window.localStorage.setItem(STORAGE_KEYS.CLAUDE_API_KEY, encrypted);
    return true;
  } catch (error) {
    console.error('Failed to save Claude API key:', error);
    return false;
  }
}

/**
 * 保存されたClaude APIキーを復号化して取得
 */
export function loadClaudeApiKey(): string {
  if (!isLocalStorageAvailable()) {
    return '';
  }
  
  try {
    const encrypted = window.localStorage.getItem(STORAGE_KEYS.CLAUDE_API_KEY);
    if (!encrypted) {
      return '';
    }
    return decrypt(encrypted);
  } catch (error) {
    console.error('Failed to load Claude API key:', error);
    return '';
  }
}

/**
 * Claude APIキーを削除
 */
export function removeClaudeApiKey(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.removeItem(STORAGE_KEYS.CLAUDE_API_KEY);
    return true;
  } catch (error) {
    console.error('Failed to remove Claude API key:', error);
    return false;
  }
}

/**
 * Claude APIキーが保存されているかチェック
 */
export function hasClaudeApiKey(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  const key = loadClaudeApiKey();
  return key.length > 0;
}

/**
 * 選択されたAIモデルを保存
 */
export function saveSelectedAI(ai: 'gemini' | 'claude'): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(STORAGE_KEYS.SELECTED_AI, ai);
    return true;
  } catch (error) {
    console.error('Failed to save selected AI:', error);
    return false;
  }
}

/**
 * 選択されたAIモデルを取得
 */
export function loadSelectedAI(): 'gemini' | 'claude' {
  if (!isLocalStorageAvailable()) {
    return 'gemini';
  }
  
  try {
    const ai = window.localStorage.getItem(STORAGE_KEYS.SELECTED_AI);
    return ai === 'claude' ? 'claude' : 'gemini';
  } catch (error) {
    console.error('Failed to load selected AI:', error);
    return 'gemini';
  }
}

/**
 * すべてのアプリケーションデータをクリア
 */
export function clearAllAppData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear app data:', error);
    return false;
  }
}