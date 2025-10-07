/**
 * Phase 5.5: しおり公開・非公開アクションのテスト
 * 
 * Zustand storeの公開関連アクションをテストします。
 */

import { PublicItinerarySettings, ItineraryData } from '@/types/itinerary';

/**
 * モックデータ: テスト用しおり
 */
export const mockItinerary: ItineraryData = {
  id: 'test-itinerary-publish',
  title: '大阪・神戸2泊3日の旅',
  destination: '大阪',
  startDate: '2024-05-01',
  endDate: '2024-05-03',
  duration: 3,
  summary: 'グルメと観光を楽しむ関西の旅',
  schedule: [
    {
      day: 1,
      date: '2024-05-01',
      title: '大阪到着・道頓堀散策',
      spots: [
        {
          id: 'spot-1',
          name: '道頓堀',
          description: '大阪のシンボル的観光地',
          category: 'sightseeing',
          scheduledTime: '14:00',
          duration: 120,
          estimatedCost: 0,
        },
        {
          id: 'spot-2',
          name: 'たこ焼き屋',
          description: '本場のたこ焼きを堪能',
          category: 'dining',
          scheduledTime: '16:00',
          duration: 30,
          estimatedCost: 800,
        },
      ],
      totalCost: 800,
      status: 'completed',
    },
  ],
  totalBudget: 30000,
  status: 'completed',
  createdAt: new Date('2024-04-01'),
  updatedAt: new Date('2024-04-20'),
  // 初期状態は非公開
  isPublic: false,
};

/**
 * テスト用公開設定
 */
export const mockPublicSettings: PublicItinerarySettings = {
  isPublic: true,
  allowPdfDownload: true,
  customMessage: 'この大阪・神戸旅行を参考にどうぞ！',
};

/**
 * テストシナリオ
 */
export const testScenarios = {
  /**
   * シナリオ1: しおりを公開する
   */
  scenario1: {
    description: 'しおりを公開してURLを発行',
    itinerary: mockItinerary,
    settings: mockPublicSettings,
    expectedResult: {
      success: true,
      hasPublicUrl: true,
      hasSlug: true,
    },
    expectedItineraryUpdates: {
      isPublic: true,
      allowPdfDownload: true,
      customMessage: 'この大阪・神戸旅行を参考にどうぞ！',
      viewCount: 0,
    },
  },

  /**
   * シナリオ2: 公開設定を更新する
   */
  scenario2: {
    description: '公開中のしおりの設定を変更',
    initialSettings: mockPublicSettings,
    newSettings: {
      allowPdfDownload: false,
      customMessage: '更新されたメッセージです',
    },
    expectedUpdates: {
      allowPdfDownload: false,
      customMessage: '更新されたメッセージです',
    },
  },

  /**
   * シナリオ3: しおりを非公開にする
   */
  scenario3: {
    description: '公開中のしおりを非公開に変更',
    expectedResult: {
      success: true,
    },
    expectedItineraryUpdates: {
      isPublic: false,
      publicSlug: undefined,
      publishedAt: undefined,
      allowPdfDownload: undefined,
      customMessage: undefined,
      viewCount: undefined,
    },
  },

  /**
   * シナリオ4: PDFダウンロード許可の切り替え
   */
  scenario4: {
    description: 'PDFダウンロード許可をON→OFF→ONと切り替え',
    steps: [
      { allowPdfDownload: true, expected: true },
      { allowPdfDownload: false, expected: false },
      { allowPdfDownload: true, expected: true },
    ],
  },

  /**
   * シナリオ5: カスタムメッセージの変更
   */
  scenario5: {
    description: 'カスタムメッセージを変更',
    messages: [
      'メッセージ1',
      'メッセージ2',
      '',  // 空のメッセージ
      'メッセージ3',
    ],
  },
};

/**
 * 手動テスト手順（ブラウザコンソール）
 * 
 * ```javascript
 * // 1. しおりが存在することを確認
 * const store = useStore.getState();
 * console.log('現在のしおり:', store.currentItinerary);
 * 
 * // 2. しおりを公開
 * const publishResult = await store.publishItinerary({
 *   isPublic: true,
 *   allowPdfDownload: true,
 *   customMessage: 'テストメッセージ',
 * });
 * console.log('公開結果:', publishResult);
 * // 期待: { success: true, publicUrl: "...", slug: "..." }
 * 
 * // 3. しおりの状態を確認
 * const updatedItinerary = store.currentItinerary;
 * console.log('更新されたしおり:', {
 *   isPublic: updatedItinerary.isPublic,
 *   publicSlug: updatedItinerary.publicSlug,
 *   allowPdfDownload: updatedItinerary.allowPdfDownload,
 *   customMessage: updatedItinerary.customMessage,
 * });
 * // 期待: { isPublic: true, publicSlug: "...", ... }
 * 
 * // 4. 公開URLを確認
 * console.log('公開URL:', publishResult.publicUrl);
 * // 期待: "http://localhost:3000/share/V1StGXR8_Z" (例)
 * 
 * // 5. LocalStorageを確認
 * const publicItineraries = JSON.parse(
 *   localStorage.getItem('journee_public_itineraries') || '{}'
 * );
 * console.log('LocalStorageの公開しおり:', publicItineraries);
 * 
 * // 6. 公開設定を更新
 * store.updatePublicSettings({
 *   allowPdfDownload: false,
 *   customMessage: '更新されたメッセージ',
 * });
 * console.log('設定更新後:', {
 *   allowPdfDownload: store.currentItinerary.allowPdfDownload,
 *   customMessage: store.currentItinerary.customMessage,
 * });
 * 
 * // 7. しおりを非公開にする
 * const unpublishResult = await store.unpublishItinerary();
 * console.log('非公開結果:', unpublishResult);
 * // 期待: { success: true }
 * 
 * // 8. 非公開後の状態を確認
 * console.log('非公開後のしおり:', {
 *   isPublic: store.currentItinerary.isPublic,
 *   publicSlug: store.currentItinerary.publicSlug,
 * });
 * // 期待: { isPublic: false, publicSlug: undefined }
 * 
 * // 9. LocalStorageから削除されたか確認
 * const afterUnpublish = JSON.parse(
 *   localStorage.getItem('journee_public_itineraries') || '{}'
 * );
 * console.log('非公開後のLocalStorage:', afterUnpublish);
 * // 期待: スラッグがキーとして存在しない
 * ```
 */

/**
 * UIテスト手順（実際の画面操作）
 * 
 * 1. しおりを作成
 *    - チャットで旅行計画を作成
 *    - スケジュールが生成されることを確認
 * 
 * 2. 共有ボタンをクリック
 *    - しおりプレビューの左上にある「共有」ボタンをクリック
 *    - 公開設定パネルが開く
 * 
 * 3. 公開設定を行う
 *    - 「公開する」にチェックを入れる
 *    - 「PDFダウンロードを許可」にチェックを入れる
 *    - カスタムメッセージを入力（オプション）
 *    - 「公開URLを発行」ボタンをクリック
 * 
 * 4. 公開URLを確認
 *    - Toast通知「しおりを公開しました！」が表示される
 *    - パネルが「公開中」の状態に切り替わる
 *    - 公開URLが表示される（例: http://localhost:3000/share/V1StGXR8_Z）
 * 
 * 5. URLをコピー
 *    - コピーボタンをクリック
 *    - Toast通知「URLをコピーしました」が表示される
 *    - アイコンが一時的にCheckマークに変わる
 * 
 * 6. 公開ページを開く
 *    - 新しいタブで公開URLを開く
 *    - しおりの内容が表示される
 *    - 編集ボタンは表示されない（Read-only）
 *    - カスタムメッセージが青いボックスで表示される
 * 
 * 7. 公開設定を変更
 *    - 元のタブに戻る
 *    - 「共有」ボタンをクリック
 *    - PDFダウンロード許可のチェックを外す
 *    - カスタムメッセージを変更
 *    - 「設定を更新」ボタンをクリック
 *    - Toast通知「設定を更新しました」が表示される
 * 
 * 8. 公開ページで変更を確認
 *    - 公開ページをリロード
 *    - PDFダウンロードボタンが非表示になっている
 *    - カスタムメッセージが更新されている
 * 
 * 9. しおりを非公開にする
 *    - 元のタブに戻る
 *    - 「共有」ボタンをクリック
 *    - 「公開を停止」ボタンをクリック
 *    - 確認ダイアログで「OK」をクリック
 *    - Toast通知「しおりを非公開にしました」が表示される
 *    - パネルが「非公開」の状態に切り替わる
 * 
 * 10. 非公開後の確認
 *     - 公開ページのタブをリロード
 *     - 404ページが表示される
 *     - 「しおりが見つかりません」メッセージが表示される
 */

/**
 * エラーケースのテスト
 */
export const errorScenarios = {
  /**
   * エラー1: しおりが存在しない場合
   */
  error1: {
    description: 'しおりがnullの場合、公開できない',
    itinerary: null,
    expectedError: 'しおりが存在しません',
  },

  /**
   * エラー2: ネットワークエラー
   */
  error2: {
    description: 'API呼び出しが失敗した場合',
    simulateNetworkError: true,
    expectedError: '公開に失敗しました',
  },

  /**
   * エラー3: 無効な設定
   */
  error3: {
    description: '公開設定が無効な場合',
    settings: {
      isPublic: false,  // 公開フラグがfalse
      allowPdfDownload: true,
    },
    expectedBehavior: 'ボタンが無効化される',
  },
};

/**
 * パフォーマンステスト
 */
export const performanceTests = {
  /**
   * テスト1: 大量のスラッグ生成
   */
  test1: {
    description: 'nanoidで1000個のスラッグを生成して重複チェック',
    count: 1000,
    expectedUnique: 1000,  // すべてユニークであるべき
  },

  /**
   * テスト2: LocalStorageのパフォーマンス
   */
  test2: {
    description: '100個の公開しおりを保存・取得',
    count: 100,
    expectedTimePerOperation: '< 10ms',
  },
};

export default testScenarios;
