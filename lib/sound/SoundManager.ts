/**
 * SoundManager - 効果音再生・音量制御ユーティリティ
 * 
 * Phase 3.6.1 で実装された効果音システムの基礎構築
 * 
 * 主な機能:
 * - 効果音のプリロード
 * - 音声再生（音量制御付き）
 * - グローバル音量設定
 * - 音声ON/OFF切り替え
 */

/**
 * 効果音の種類を定義
 */
export type SoundType = 
  | 'notification'  // AI返信通知音
  | 'send'          // メッセージ送信音
  | 'update'        // しおり更新音
  | 'error'         // エラー通知音
  | 'success';      // 成功通知音（汎用）

/**
 * 効果音のパスマッピング
 */
const SOUND_PATHS: Record<SoundType, string> = {
  notification: '/sounds/notification.mp3',
  send: '/sounds/send.mp3',
  update: '/sounds/update.mp3',
  error: '/sounds/error.mp3',
  success: '/sounds/success.mp3',
};

/**
 * SoundManager クラス
 * 
 * シングルトンパターンで実装し、アプリ全体で1つのインスタンスを共有
 */
class SoundManager {
  private static instance: SoundManager;
  private audioCache: Map<SoundType, HTMLAudioElement> = new Map();
  private volume: number = 0.7; // デフォルト音量: 70%
  private enabled: boolean = true; // デフォルト: 効果音ON
  private preloaded: boolean = false;

  /**
   * プライベートコンストラクタ（シングルトン）
   */
  private constructor() {
    // クライアントサイドでのみ初期化
    if (typeof window === 'undefined') {
      return;
    }
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * すべての効果音をプリロード
   * 
   * アプリ起動時に呼び出すことで、再生遅延を最小化
   */
  public async preloadAll(): Promise<void> {
    if (typeof window === 'undefined' || this.preloaded) {
      return;
    }

    const soundTypes = Object.keys(SOUND_PATHS) as SoundType[];
    
    const preloadPromises = soundTypes.map((type) => {
      return this.preloadSound(type);
    });

    try {
      await Promise.all(preloadPromises);
      this.preloaded = true;
      console.log('[SoundManager] すべての効果音をプリロードしました');
    } catch (error) {
      console.warn('[SoundManager] 効果音のプリロードに失敗しました:', error);
      // プリロードに失敗してもアプリは動作する
    }
  }

  /**
   * 特定の効果音をプリロード
   */
  private async preloadSound(type: SoundType): Promise<void> {
    if (this.audioCache.has(type)) {
      return; // すでにキャッシュ済み
    }

    const audio = new Audio(SOUND_PATHS[type]);
    audio.preload = 'auto';
    audio.volume = this.volume;

    // 音声ファイルの読み込みを待機
    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        this.audioCache.set(type, audio);
        resolve();
      }, { once: true });

      audio.addEventListener('error', (error) => {
        console.warn(`[SoundManager] 効果音 "${type}" の読み込みに失敗しました:`, error);
        // エラーでもresolve（アプリは継続）
        resolve();
      }, { once: true });

      // タイムアウト設定（5秒）
      setTimeout(() => {
        console.warn(`[SoundManager] 効果音 "${type}" の読み込みがタイムアウトしました`);
        resolve();
      }, 5000);
    });
  }

  /**
   * 効果音を再生
   * 
   * @param type - 再生する効果音の種類
   * @param volumeOverride - 一時的な音量設定（0.0 - 1.0、オプション）
   */
  public async play(type: SoundType, volumeOverride?: number): Promise<void> {
    // サーバーサイドまたは効果音OFFの場合は何もしない
    if (typeof window === 'undefined' || !this.enabled) {
      return;
    }

    try {
      let audio = this.audioCache.get(type);

      // キャッシュにない場合は即座にロード
      if (!audio) {
        await this.preloadSound(type);
        audio = this.audioCache.get(type);
      }

      if (!audio) {
        console.warn(`[SoundManager] 効果音 "${type}" が見つかりません`);
        return;
      }

      // 音量設定（オーバーライドがあればそれを使用）
      audio.volume = volumeOverride !== undefined 
        ? Math.max(0, Math.min(1, volumeOverride))
        : this.volume;

      // 再生位置をリセット（連続再生対応）
      audio.currentTime = 0;

      // 再生
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // ブラウザの自動再生ポリシーによるエラーを抑制
          if (error.name === 'NotAllowedError') {
            console.warn('[SoundManager] 自動再生がブロックされました。ユーザーインタラクション後に再生できます。');
          } else {
            console.warn(`[SoundManager] 効果音 "${type}" の再生に失敗しました:`, error);
          }
        });
      }
    } catch (error) {
      console.warn(`[SoundManager] 効果音 "${type}" の再生中にエラーが発生しました:`, error);
    }
  }

  /**
   * グローバル音量を設定
   * 
   * @param volume - 音量（0.0 - 1.0）
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // キャッシュ済みの音声の音量も更新
    this.audioCache.forEach((audio) => {
      audio.volume = this.volume;
    });

    console.log(`[SoundManager] 音量を ${Math.round(this.volume * 100)}% に設定しました`);
  }

  /**
   * 現在の音量を取得
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * 効果音のON/OFF切り替え
   * 
   * @param enabled - true: ON, false: OFF
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[SoundManager] 効果音を ${enabled ? 'ON' : 'OFF'} にしました`);
  }

  /**
   * 効果音が有効かどうかを取得
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * すべてのキャッシュをクリア（メモリ解放）
   */
  public clearCache(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();
    this.preloaded = false;
    console.log('[SoundManager] 音声キャッシュをクリアしました');
  }

  /**
   * 効果音のテスト再生
   * 
   * 設定画面などで使用（音が正しく鳴るか確認）
   */
  public async testSound(type: SoundType): Promise<void> {
    const wasEnabled = this.enabled;
    this.enabled = true; // 一時的にON
    await this.play(type);
    this.enabled = wasEnabled; // 元の設定に戻す
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const soundManager = SoundManager.getInstance();

/**
 * 便利な関数をエクスポート
 */

/**
 * 効果音を再生（ショートハンド）
 */
export const playSound = (type: SoundType, volume?: number) => {
  return soundManager.play(type, volume);
};

/**
 * すべての効果音をプリロード
 */
export const preloadAllSounds = () => {
  return soundManager.preloadAll();
};

/**
 * 音量を設定
 */
export const setSoundVolume = (volume: number) => {
  soundManager.setVolume(volume);
};

/**
 * 効果音のON/OFF切り替え
 */
export const setSoundEnabled = (enabled: boolean) => {
  soundManager.setEnabled(enabled);
};

/**
 * 効果音のテスト再生
 */
export const testSound = (type: SoundType) => {
  return soundManager.testSound(type);
};