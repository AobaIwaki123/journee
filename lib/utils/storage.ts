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
  SOUND_ENABLED: 'journee_sound_enabled', // Phase 3.6用
  SOUND_VOLUME: 'journee_sound_volume', // Phase 3.6用
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
 * 効果音のON/OFF設定を保存（Phase 3.6）
 */
export function saveSoundEnabled(enabled: boolean): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
    return true;
  } catch (error) {
    console.error('Failed to save sound enabled:', error);
    return false;
  }
}

/**
 * 効果音のON/OFF設定を取得（Phase 3.6）
 */
export function loadSoundEnabled(): boolean {
  if (!isLocalStorageAvailable()) {
    return true; // デフォルト: ON
  }
  
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    if (value === null) {
      return true; // デフォルト: ON
    }
    return value === 'true';
  } catch (error) {
    console.error('Failed to load sound enabled:', error);
    return true;
  }
}

/**
 * 効果音の音量設定を保存（Phase 3.6）
 * @param volume - 音量（0.0 - 1.0）
 */
export function saveSoundVolume(volume: number): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    // 0.0 - 1.0 の範囲にクランプ
    const clampedVolume = Math.max(0, Math.min(1, volume));
    window.localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(clampedVolume));
    return true;
  } catch (error) {
    console.error('Failed to save sound volume:', error);
    return false;
  }
}

/**
 * 効果音の音量設定を取得（Phase 3.6）
 */
export function loadSoundVolume(): number {
  if (!isLocalStorageAvailable()) {
    return 0.7; // デフォルト: 70%
  }
  
  try {
    const value = window.localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME);
    if (value === null) {
      return 0.7; // デフォルト: 70%
    }
    const volume = parseFloat(value);
    if (isNaN(volume)) {
      return 0.7;
    }
    // 0.0 - 1.0 の範囲にクランプ
    return Math.max(0, Math.min(1, volume));
  } catch (error) {
    console.error('Failed to load sound volume:', error);
    return 0.7;
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