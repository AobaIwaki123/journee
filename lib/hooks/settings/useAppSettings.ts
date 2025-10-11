/**
 * Phase 10.2: useAppSettings Hook
 * 
 * 設定管理
 * - 設定の読み込み・保存
 * - バリデーション
 * - エクスポート・インポート
 */

import { useCallback } from 'react';
import { useSettingsStore } from '@/lib/store/settings';
import type { AppSettings } from '@/types/settings';

export interface UseAppSettingsReturn {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateGeneralSettings: (updates: Partial<AppSettings['general']>) => void;
  updateSoundSettings: (updates: Partial<AppSettings['sound']>) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => void;
}

export function useAppSettings(): UseAppSettingsReturn {
  const {
    settings,
    updateSettings,
    updateGeneralSettings,
    updateSoundSettings,
    resetToDefaults,
  } = useSettingsStore();
  
  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);
  
  const importSettings = useCallback((data: string) => {
    try {
      const imported: AppSettings = JSON.parse(data);
      updateSettings(imported);
    } catch (error) {
      console.error('Failed to import settings:', error);
    }
  }, [updateSettings]);
  
  return {
    settings,
    updateSettings,
    updateGeneralSettings,
    updateSoundSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  };
}
