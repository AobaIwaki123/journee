'use client';

/**
 * SoundProvider - グローバル音声管理プロバイダー
 * 
 * Phase 3.6.1 で実装された効果音システムの基礎構築
 * 
 * 機能:
 * - アプリ起動時に効果音をプリロード
 * - Zustandストアと連携した音声設定の管理
 * - 子コンポーネントへの音声機能の提供
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useStore } from '@/lib/store/useStore';
import { 
  soundManager, 
  playSound, 
  testSound,
  type SoundType 
} from '@/lib/sound/SoundManager';

/**
 * SoundContext の型定義
 */
interface SoundContextValue {
  /**
   * 効果音を再生
   * @param type - 効果音の種類
   * @param volumeOverride - 一時的な音量設定（オプション）
   */
  play: (type: SoundType, volumeOverride?: number) => Promise<void>;
  
  /**
   * 効果音のテスト再生（設定画面用）
   * @param type - 効果音の種類
   */
  test: (type: SoundType) => Promise<void>;
  
  /**
   * 効果音のON/OFF状態
   */
  isEnabled: boolean;
  
  /**
   * 現在の音量（0.0 - 1.0）
   */
  volume: number;
  
  /**
   * 効果音のON/OFF切り替え
   */
  setEnabled: (enabled: boolean) => void;
  
  /**
   * 音量を設定
   */
  setVolume: (volume: number) => void;
}

/**
 * SoundContext
 */
const SoundContext = createContext<SoundContextValue | undefined>(undefined);

/**
 * SoundProvider Props
 */
interface SoundProviderProps {
  children: ReactNode;
  /**
   * 自動プリロードを無効にする（テスト時など）
   */
  disablePreload?: boolean;
}

/**
 * SoundProvider コンポーネント
 * 
 * アプリケーション全体を囲むことで、すべてのコンポーネントで効果音機能を利用可能にする
 * 
 * 使用例:
 * ```tsx
 * <SoundProvider>
 *   <App />
 * </SoundProvider>
 * ```
 */
export const SoundProvider: React.FC<SoundProviderProps> = ({ 
  children, 
  disablePreload = false 
}) => {
  const { soundEnabled, soundVolume, setSoundEnabled, setSoundVolume } = useStore();

  /**
   * 初期化処理
   * - 効果音のプリロード
   * - LocalStorageからの設定復元
   */
  useEffect(() => {
    if (disablePreload) {
      return;
    }

    // 効果音をプリロード（非同期）
    soundManager.preloadAll().catch((error) => {
      console.warn('[SoundProvider] プリロード中にエラーが発生しました:', error);
    });

    console.log('[SoundProvider] 初期化完了');

    // クリーンアップ
    return () => {
      // 必要に応じてキャッシュをクリア（通常は不要）
      // soundManager.clearCache();
    };
  }, [disablePreload]);

  /**
   * Context の値
   */
  const contextValue: SoundContextValue = {
    play: playSound,
    test: testSound,
    isEnabled: soundEnabled,
    volume: soundVolume,
    setEnabled: setSoundEnabled,
    setVolume: setSoundVolume,
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
};

/**
 * useSound フック
 * 
 * 音声機能にアクセスするためのカスタムフック
 * 
 * 使用例:
 * ```tsx
 * const { play, isEnabled, setEnabled } = useSound();
 * 
 * // 効果音を再生
 * const handleClick = () => {
 *   play('send');
 * };
 * 
 * // 設定を変更
 * const toggleSound = () => {
 *   setEnabled(!isEnabled);
 * };
 * ```
 */
export const useSound = (): SoundContextValue => {
  const context = useContext(SoundContext);
  
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  
  return context;
};

/**
 * withSound HOC（高階コンポーネント）
 * 
 * クラスコンポーネント用のヘルパー（通常は useSound フックを使用）
 * 
 * 使用例:
 * ```tsx
 * const MyComponent = withSound(({ sound }) => {
 *   return (
 *     <button onClick={() => sound.play('send')}>
 *       送信
 *     </button>
 *   );
 * });
 * ```
 */
export function withSound<P extends { sound: SoundContextValue }>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, 'sound'>> {
  return (props) => {
    const sound = useSound();
    return <Component {...(props as P)} sound={sound} />;
  };
}

/**
 * デフォルトエクスポート
 */
export default SoundProvider;