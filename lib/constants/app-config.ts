/**
 * アプリケーション全体の設定定数
 */

/**
 * アプリケーション設定
 * 定数値を一元管理
 */
export const APP_CONFIG = {
  /**
   * チャット関連の設定
   */
  chat: {
    /** チャット履歴の最大保持件数（API送信時） */
    maxHistoryLength: 10,
    /** メッセージの最大文字数 */
    maxMessageLength: 1000,
  },

  /**
   * しおり関連の設定
   */
  itinerary: {
    /** 旅行期間の最大日数 */
    maxDays: 30,
    /** 1日あたりの最大スポット数 */
    maxSpotsPerDay: 10,
  },

  /**
   * UI/UX関連の設定
   */
  ui: {
    /** トースト通知の表示時間（ミリ秒） */
    toastDuration: 3000,
    /** アニメーション時間（ミリ秒） */
    animationDuration: 300,
    /** スクロールアニメーション時間（ミリ秒） */
    scrollDuration: 500,
  },

  /**
   * API関連の設定
   */
  api: {
    /** APIリクエストのタイムアウト（ミリ秒） */
    timeout: 30000,
    /** リトライ回数 */
    maxRetries: 3,
  },

  /**
   * セキュリティ関連の設定
   */
  security: {
    /** セッションの有効期限（日数） */
    sessionMaxAge: 30,
    /** パスワードの最小文字数（Phase 9実装予定） */
    minPasswordLength: 8,
  },
} as const;

/**
 * エラーメッセージの定数
 */
export const ERROR_MESSAGES = {
  /** ネットワークエラー */
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  /** 認証エラー */
  UNAUTHORIZED: 'ログインが必要です。',
  /** サーバーエラー */
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。',
  /** バリデーションエラー */
  VALIDATION_ERROR: '入力内容に誤りがあります。',
  /** 不明なエラー */
  UNKNOWN_ERROR: '不明なエラーが発生しました。',
  /** APIキーエラー */
  API_KEY_ERROR: 'APIキーの設定に問題があります。設定を確認してください。',
  /** レート制限エラー */
  RATE_LIMIT_ERROR: 'アクセスが集中しています。少し時間をおいて再度お試しください。',
} as const;

/**
 * 成功メッセージの定数
 */
export const SUCCESS_MESSAGES = {
  /** しおり作成成功 */
  ITINERARY_CREATED: 'しおりを作成しました。',
  /** しおり更新成功 */
  ITINERARY_UPDATED: 'しおりを更新しました。',
  /** しおり削除成功 */
  ITINERARY_DELETED: 'しおりを削除しました。',
  /** 設定保存成功 */
  SETTINGS_SAVED: '設定を保存しました。',
} as const;