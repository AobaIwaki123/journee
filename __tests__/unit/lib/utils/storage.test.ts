import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey,
  hasClaudeApiKey,
  saveSelectedAI,
  loadSelectedAI,
  saveAppSettings,
  loadAppSettings,
  clearAllAppData,
  saveAutoProgressMode,
  loadAutoProgressMode,
  saveAutoProgressSettings,
  loadAutoProgressSettings,
} from '@/lib/utils/storage';

describe('Claude API Key storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load API key', () => {
    const apiKey = 'sk-ant-test-key-123456';
    
    const saved = saveClaudeApiKey(apiKey);
    expect(saved).toBe(true);
    
    const loaded = loadClaudeApiKey();
    expect(loaded).toBe(apiKey);
  });

  it('should return empty string when no key is saved', () => {
    const loaded = loadClaudeApiKey();
    expect(loaded).toBe('');
  });

  it('should remove API key', () => {
    saveClaudeApiKey('test-key');
    
    const removed = removeClaudeApiKey();
    expect(removed).toBe(true);
    
    const loaded = loadClaudeApiKey();
    expect(loaded).toBe('');
  });

  it('should check if API key exists', () => {
    expect(hasClaudeApiKey()).toBe(false);
    
    saveClaudeApiKey('test-key');
    expect(hasClaudeApiKey()).toBe(true);
    
    removeClaudeApiKey();
    expect(hasClaudeApiKey()).toBe(false);
  });

  it('should encrypt stored API key', () => {
    const apiKey = 'sk-ant-secret-key';
    saveClaudeApiKey(apiKey);
    
    // LocalStorageに直接保存された値は暗号化されているべき
    const stored = localStorage.getItem('journee_claude_api_key');
    expect(stored).not.toBe(apiKey);
    expect(stored).toBeTruthy();
  });
});

describe('AI Model selection storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load selected AI model', () => {
    const saved = saveSelectedAI('claude');
    expect(saved).toBe(true);
    
    const loaded = loadSelectedAI();
    expect(loaded).toBe('claude');
  });

  it('should return default AI when nothing is saved', () => {
    const loaded = loadSelectedAI();
    expect(loaded).toBe('gemini'); // DEFAULT_AI_MODEL
  });

  it('should validate model ID and return default for invalid', () => {
    localStorage.setItem('journee_selected_ai', 'invalid-model');
    
    const loaded = loadSelectedAI();
    expect(loaded).toBe('gemini'); // Should fallback to default
  });

  it('should handle gemini model', () => {
    saveSelectedAI('gemini');
    const loaded = loadSelectedAI();
    expect(loaded).toBe('gemini');
  });
});

describe('App Settings storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load app settings', () => {
    const settings = {
      theme: 'dark',
      language: 'ja',
      notifications: true,
    };
    
    const saved = saveAppSettings(settings);
    expect(saved).toBe(true);
    
    const loaded = loadAppSettings();
    expect(loaded).toEqual(settings);
  });

  it('should return null when no settings are saved', () => {
    const loaded = loadAppSettings();
    expect(loaded).toBeNull();
  });

  it('should handle complex nested settings', () => {
    const settings = {
      user: {
        name: 'Test User',
        preferences: {
          sound: { enabled: true, volume: 0.5 },
        },
      },
    };
    
    saveAppSettings(settings);
    const loaded = loadAppSettings();
    expect(loaded).toEqual(settings);
  });
});

describe('Auto Progress settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load auto progress mode', () => {
    saveAutoProgressMode(false);
    expect(loadAutoProgressMode()).toBe(false);
    
    saveAutoProgressMode(true);
    expect(loadAutoProgressMode()).toBe(true);
  });

  it('should default to true when not set', () => {
    expect(loadAutoProgressMode()).toBe(true);
  });

  it('should save and load auto progress settings', () => {
    const settings = {
      enabled: false,
      parallelCount: 5,
      showNotifications: false,
    };
    
    saveAutoProgressSettings(settings);
    const loaded = loadAutoProgressSettings();
    
    expect(loaded).toEqual(settings);
  });

  it('should return default settings when not set', () => {
    const loaded = loadAutoProgressSettings();
    
    expect(loaded).toEqual({
      enabled: true,
      parallelCount: 3,
      showNotifications: true,
    });
  });

  it('should merge partial settings with defaults', () => {
    const partialSettings = {
      enabled: false,
      parallelCount: 2,
      // showNotifications is missing
    };
    
    // LocalStorageに部分的な設定を保存
    localStorage.setItem(
      'journee_auto_progress_settings',
      JSON.stringify(partialSettings)
    );
    
    const loaded = loadAutoProgressSettings();
    
    expect(loaded.enabled).toBe(false);
    expect(loaded.parallelCount).toBe(2);
    expect(loaded.showNotifications).toBe(true); // default value
  });
});

describe('clearAllAppData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear all app-specific data', () => {
    saveClaudeApiKey('test-key');
    saveSelectedAI('claude');
    saveAppSettings({ theme: 'dark' });
    saveAutoProgressMode(false);
    
    const cleared = clearAllAppData();
    expect(cleared).toBe(true);
    
    expect(loadClaudeApiKey()).toBe('');
    expect(loadSelectedAI()).toBe('gemini'); // default
    expect(loadAppSettings()).toBeNull();
    expect(loadAutoProgressMode()).toBe(true); // default
  });

  it('should not affect non-app data in localStorage', () => {
    localStorage.setItem('other-app-data', 'should-remain');
    
    saveClaudeApiKey('test');
    clearAllAppData();
    
    expect(localStorage.getItem('other-app-data')).toBe('should-remain');
  });
});