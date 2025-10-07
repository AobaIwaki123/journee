/**
 * LocalStorageヘルパー
 * ブラウザのLocalStorageへの安全なアクセスを提供
 */

import { encrypt, decrypt } from './encryption';
import type { AIModelId } from '@/types/ai';
import { isValidModelId, DEFAULT_AI_MODEL } from '@/lib/ai/models';

// LocalStorageキー
const STORAGE_KEYS = {
  CLAUDE_API_KEY: 'journee_claude_api_key',
  SELECTED_AI: 'journee_selected_ai',
  PANEL_WIDTH: 'journee_panel_width', // Phase 7用
  AUTO_PROGRESS_MODE: 'journee_auto_progress_mode', // Phase 4.10用
  AUTO_PROGRESS_SETTINGS: 'journee_auto_progress_settings', // Phase 4.10用
  APP_SETTINGS: 'journee_app_settings', // Phase 5.4.3用
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
export function saveSelectedAI(ai: AIModelId): boolean {
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
export function loadSelectedAI(): AIModelId {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_AI_MODEL;
  }
  
  try {
    const ai = window.localStorage.getItem(STORAGE_KEYS.SELECTED_AI);
    // 有効なモデルIDかチェック
    if (ai && isValidModelId(ai)) {
      return ai;
    }
    return DEFAULT_AI_MODEL;
  } catch (error) {
    console.error('Failed to load selected AI:', error);
    return DEFAULT_AI_MODEL;
  }
}

/**
 * アプリケーション設定を保存
 */
export function saveAppSettings(settings: Record<string, any>): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save app settings:', error);
    return false;
  }
}

/**
 * アプリケーション設定を取得
 */
export function loadAppSettings(): Record<string, any> | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  
  try {
    const settings = window.localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (!settings) {
      return null;
    }
    return JSON.parse(settings);
  } catch (error) {
    console.error('Failed to load app settings:', error);
    return null;
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

/**
 * Phase 4.10: 自動進行モードの設定
 */

export interface AutoProgressSettings {
  enabled: boolean;
  parallelCount: number; // 並列数（デフォルト: 3）
  showNotifications: boolean; // 通知表示（デフォルト: true）
}

/**
 * 自動進行モード設定を保存
 */
export function saveAutoProgressMode(enabled: boolean): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(STORAGE_KEYS.AUTO_PROGRESS_MODE, enabled.toString());
    return true;
  } catch (error) {
    console.error('Failed to save auto progress mode:', error);
    return false;
  }
}

/**
 * 自動進行モード設定を取得
 */
export function loadAutoProgressMode(): boolean {
  if (!isLocalStorageAvailable()) {
    return true; // デフォルトはON
  }
  
  try {
    const mode = window.localStorage.getItem(STORAGE_KEYS.AUTO_PROGRESS_MODE);
    if (mode === null) {
      return true; // デフォルトはON
    }
    return mode === 'true';
  } catch (error) {
    console.error('Failed to load auto progress mode:', error);
    return true;
  }
}

/**
 * 自動進行詳細設定を保存
 */
export function saveAutoProgressSettings(settings: AutoProgressSettings): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.AUTO_PROGRESS_SETTINGS,
      JSON.stringify(settings)
    );
    return true;
  } catch (error) {
    console.error('Failed to save auto progress settings:', error);
    return false;
  }
}

/**
 * 自動進行詳細設定を取得
 */
export function loadAutoProgressSettings(): AutoProgressSettings {
  const defaultSettings: AutoProgressSettings = {
    enabled: true,
    parallelCount: 3,
    showNotifications: true,
  };
  
  if (!isLocalStorageAvailable()) {
    return defaultSettings;
  }
  
  try {
    const settingsStr = window.localStorage.getItem(STORAGE_KEYS.AUTO_PROGRESS_SETTINGS);
    if (!settingsStr) {
      return defaultSettings;
    }
    
    const settings = JSON.parse(settingsStr) as AutoProgressSettings;
    return {
      ...defaultSettings,
      ...settings,
    };
  } catch (error) {
    console.error('Failed to load auto progress settings:', error);
    return defaultSettings;
  }
}