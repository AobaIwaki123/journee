/**
 * 設定関連の型定義
 * Phase 5.4.3 - 設定ページ
 */

/**
 * 通貨設定
 */
export type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP';

/**
 * 一般設定
 */
export interface GeneralSettings {
  currency: Currency;
}

/**
 * 効果音設定（Phase 3.6連携）
 */
export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
}

/**
 * アプリケーション設定
 */
export interface AppSettings {
  general: GeneralSettings;
  sound: SoundSettings;
}

/**
 * デフォルト設定値
 */
export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    currency: 'JPY',
  },
  sound: {
    enabled: true,
    volume: 0.7,
  },
};

/**
 * 設定セクション（タブ）
 */
export type SettingsSection = 'general' | 'ai' | 'sound' | 'account';