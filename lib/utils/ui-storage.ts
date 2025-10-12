/**
 * UI状態管理（IndexedDB版）
 * localStorageの代替としてIndexedDBを使用
 */

import { journeeDB, isIndexedDBAvailable } from './indexed-db';
import type { AIModelId } from '@/types/ai';
import { isValidModelId, DEFAULT_AI_MODEL } from '@/lib/ai/models';
import type { AutoProgressSettings } from './storage';

// デフォルト値
const DEFAULT_CHAT_PANEL_WIDTH = 40; // 40%
const MIN_PANEL_WIDTH = 30;
const MAX_PANEL_WIDTH = 70;

const DEFAULT_AUTO_PROGRESS_SETTINGS: AutoProgressSettings = {
  enabled: true,
  parallelCount: 3,
  showNotifications: true,
};

/**
 * IndexedDBが利用できない場合のフォールバック用
 * メモリ内キャッシュ
 */
const memoryCache = new Map<string, any>();

/**
 * チャットパネルの幅を保存
 */
export async function saveChatPanelWidth(width: number): Promise<boolean> {
  const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));

  if (!isIndexedDBAvailable()) {
    memoryCache.set('chat_panel_width', clampedWidth);
    return false;
  }

  try {
    await journeeDB.init();
    await journeeDB.set('ui_state', 'chat_panel_width', clampedWidth);
    return true;
  } catch (error) {
    console.error('Failed to save chat panel width:', error);
    memoryCache.set('chat_panel_width', clampedWidth);
    return false;
  }
}

/**
 * チャットパネルの幅を取得
 */
export async function loadChatPanelWidth(): Promise<number> {
  if (!isIndexedDBAvailable()) {
    return memoryCache.get('chat_panel_width') || DEFAULT_CHAT_PANEL_WIDTH;
  }

  try {
    await journeeDB.init();
    const width = await journeeDB.get<number>('ui_state', 'chat_panel_width');
    
    if (width === null) {
      return DEFAULT_CHAT_PANEL_WIDTH;
    }

    return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
  } catch (error) {
    console.error('Failed to load chat panel width:', error);
    return memoryCache.get('chat_panel_width') || DEFAULT_CHAT_PANEL_WIDTH;
  }
}

/**
 * 自動進行モードを保存
 */
export async function saveAutoProgressMode(enabled: boolean): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    memoryCache.set('auto_progress_mode', enabled);
    return false;
  }

  try {
    await journeeDB.init();
    await journeeDB.set('ui_state', 'auto_progress_mode', enabled);
    return true;
  } catch (error) {
    console.error('Failed to save auto progress mode:', error);
    memoryCache.set('auto_progress_mode', enabled);
    return false;
  }
}

/**
 * 自動進行モードを取得
 */
export async function loadAutoProgressMode(): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    return memoryCache.get('auto_progress_mode') ?? true;
  }

  try {
    await journeeDB.init();
    const mode = await journeeDB.get<boolean>('ui_state', 'auto_progress_mode');
    return mode ?? true; // デフォルトはON
  } catch (error) {
    console.error('Failed to load auto progress mode:', error);
    return memoryCache.get('auto_progress_mode') ?? true;
  }
}

/**
 * 自動進行設定を保存
 */
export async function saveAutoProgressSettings(
  settings: AutoProgressSettings
): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    memoryCache.set('auto_progress_settings', settings);
    return false;
  }

  try {
    await journeeDB.init();
    await journeeDB.set('ui_state', 'auto_progress_settings', settings);
    return true;
  } catch (error) {
    console.error('Failed to save auto progress settings:', error);
    memoryCache.set('auto_progress_settings', settings);
    return false;
  }
}

/**
 * 自動進行設定を取得
 */
export async function loadAutoProgressSettings(): Promise<AutoProgressSettings> {
  if (!isIndexedDBAvailable()) {
    return memoryCache.get('auto_progress_settings') || DEFAULT_AUTO_PROGRESS_SETTINGS;
  }

  try {
    await journeeDB.init();
    const settings = await journeeDB.get<AutoProgressSettings>(
      'ui_state',
      'auto_progress_settings'
    );
    
    if (!settings) {
      return DEFAULT_AUTO_PROGRESS_SETTINGS;
    }

    return {
      ...DEFAULT_AUTO_PROGRESS_SETTINGS,
      ...settings,
    };
  } catch (error) {
    console.error('Failed to load auto progress settings:', error);
    return (
      memoryCache.get('auto_progress_settings') || DEFAULT_AUTO_PROGRESS_SETTINGS
    );
  }
}

/**
 * 選択されたAIモデルを保存
 */
export async function saveSelectedAI(ai: AIModelId): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    memoryCache.set('selected_ai', ai);
    return false;
  }

  try {
    await journeeDB.init();
    await journeeDB.set('ui_state', 'selected_ai', ai);
    return true;
  } catch (error) {
    console.error('Failed to save selected AI:', error);
    memoryCache.set('selected_ai', ai);
    return false;
  }
}

/**
 * 選択されたAIモデルを取得
 */
export async function loadSelectedAI(): Promise<AIModelId> {
  if (!isIndexedDBAvailable()) {
    const cached = memoryCache.get('selected_ai');
    return cached && isValidModelId(cached) ? cached : DEFAULT_AI_MODEL;
  }

  try {
    await journeeDB.init();
    const ai = await journeeDB.get<string>('ui_state', 'selected_ai');
    
    if (ai && isValidModelId(ai)) {
      return ai as AIModelId;
    }
    
    return DEFAULT_AI_MODEL;
  } catch (error) {
    console.error('Failed to load selected AI:', error);
    const cached = memoryCache.get('selected_ai');
    return cached && isValidModelId(cached) ? cached : DEFAULT_AI_MODEL;
  }
}

/**
 * アプリケーション設定を保存
 */
export async function saveAppSettings(settings: Record<string, any>): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    memoryCache.set('app_settings', settings);
    return false;
  }

  try {
    await journeeDB.init();
    await journeeDB.set('settings', 'app_settings', settings);
    return true;
  } catch (error) {
    console.error('Failed to save app settings:', error);
    memoryCache.set('app_settings', settings);
    return false;
  }
}

/**
 * アプリケーション設定を取得
 */
export async function loadAppSettings(): Promise<Record<string, any> | null> {
  if (!isIndexedDBAvailable()) {
    return memoryCache.get('app_settings') || null;
  }

  try {
    await journeeDB.init();
    const settings = await journeeDB.get<Record<string, any>>(
      'settings',
      'app_settings'
    );
    return settings;
  } catch (error) {
    console.error('Failed to load app settings:', error);
    return memoryCache.get('app_settings') || null;
  }
}

/**
 * すべてのUI状態をクリア
 */
export async function clearAllUIState(): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    memoryCache.clear();
    return false;
  }

  try {
    await journeeDB.init();
    await journeeDB.clear('ui_state');
    await journeeDB.clear('settings');
    memoryCache.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear UI state:', error);
    return false;
  }
}
