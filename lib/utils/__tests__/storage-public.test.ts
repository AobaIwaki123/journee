/**
 * Phase 5.5: 公開しおり管理関数のテスト
 * 
 * LocalStorageを使用した公開しおりの保存・取得・削除機能をテストします。
 */

import {
  savePublicItinerary,
  getPublicItinerary,
  loadPublicItineraries,
  removePublicItinerary,
} from '../storage';
import { ItineraryData } from '@/types/itinerary';

/**
 * モックデータ: テスト用公開しおり
 */
export const mockPublicItinerary: ItineraryData = {
  id: 'test-public-itinerary-1',
  title: '京都・奈良3泊4日の旅',
  destination: '京都',
  startDate: '2024-04-01',
  endDate: '2024-04-04',
  duration: 4,
  summary: '古都の魅力を満喫する4日間の旅程',
  schedule: [
    {
      day: 1,
      date: '2024-04-01',
      title: '京都到着・清水寺周辺',
      spots: [
        {
          id: 'spot-1',
          name: '清水寺',
          description: '世界遺産の有名寺院',
          category: 'sightseeing',
          scheduledTime: '10:00',
          duration: 90,
          estimatedCost: 500,
        },
      ],
      totalCost: 500,
      status: 'completed',
    },
  ],
  totalBudget: 50000,
  status: 'completed',
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-15'),
  // Phase 5.5: 公開設定
  isPublic: true,
  publicSlug: 'V1StGXR8_Z',
  publishedAt: new Date('2024-03-15'),
  viewCount: 0,
  allowPdfDownload: true,
  customMessage: 'この旅行計画を参考にしてください！',
};

/**
 * テストシナリオ
 */
export const testScenarios = {
  /**
   * シナリオ1: 公開しおりの保存
   */
  scenario1: {
    description: '公開しおりをLocalStorageに保存',
    slug: 'test-slug-1',
    itinerary: mockPublicItinerary,
    expectedResult: true,
  },

  /**
   * シナリオ2: 公開しおりの取得
   */
  scenario2: {
    description: '保存された公開しおりを取得',
    slug: 'test-slug-1',
    expectedItinerary: mockPublicItinerary,
  },

  /**
   * シナリオ3: 存在しないスラッグでの取得
   */
  scenario3: {
    description: '存在しないスラッグで取得すると null を返す',
    slug: 'nonexistent-slug',
    expectedResult: null,
  },

  /**
   * シナリオ4: すべての公開しおりを取得
   */
  scenario4: {
    description: 'すべての公開しおりを取得',
    expectedKeys: ['test-slug-1'],
  },

  /**
   * シナリオ5: 公開しおりの削除
   */
  scenario5: {
    description: '公開しおりをLocalStorageから削除',
    slug: 'test-slug-1',
    expectedResult: true,
  },

  /**
   * シナリオ6: 複数の公開しおり管理
   */
  scenario6: {
    description: '複数の公開しおりを保存・管理',
    itineraries: [
      { slug: 'kyoto-trip', itinerary: mockPublicItinerary },
      { slug: 'tokyo-trip', itinerary: { ...mockPublicItinerary, id: 'test-2', destination: '東京' } },
    ],
    expectedCount: 2,
  },
};

/**
 * 手動テスト手順
 * 
 * ブラウザの開発者ツールコンソールで以下を実行:
 * 
 * ```javascript
 * // 1. 公開しおりを保存
 * const itinerary = {
 *   id: 'test-1',
 *   title: '京都旅行',
 *   destination: '京都',
 *   schedule: [],
 *   status: 'completed',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   isPublic: true,
 *   publicSlug: 'abc123',
 *   publishedAt: new Date(),
 * };
 * 
 * // 保存
 * const saved = savePublicItinerary('abc123', itinerary);
 * console.log('保存成功:', saved); // true
 * 
 * // 2. 公開しおりを取得
 * const retrieved = getPublicItinerary('abc123');
 * console.log('取得したしおり:', retrieved);
 * 
 * // 3. すべての公開しおりを取得
 * const all = loadPublicItineraries();
 * console.log('すべての公開しおり:', all);
 * 
 * // 4. 公開しおりを削除
 * const removed = removePublicItinerary('abc123');
 * console.log('削除成功:', removed); // true
 * 
 * // 5. 削除後の確認
 * const afterRemove = getPublicItinerary('abc123');
 * console.log('削除後:', afterRemove); // null
 * ```
 * 
 * 期待される出力:
 * - 保存成功: true
 * - 取得したしおり: { id: 'test-1', title: '京都旅行', ... }
 * - すべての公開しおり: { abc123: { ... } }
 * - 削除成功: true
 * - 削除後: null
 */

/**
 * LocalStorage確認コマンド
 * 
 * ```javascript
 * // LocalStorageの内容を確認
 * console.log('公開しおり:', localStorage.getItem('journee_public_itineraries'));
 * 
 * // JSON形式で見やすく表示
 * const data = JSON.parse(localStorage.getItem('journee_public_itineraries') || '{}');
 * console.log('公開しおり（整形）:', JSON.stringify(data, null, 2));
 * 
 * // すべてのJournee関連データを確認
 * Object.keys(localStorage)
 *   .filter(key => key.startsWith('journee_'))
 *   .forEach(key => {
 *     console.log(`${key}:`, localStorage.getItem(key));
 *   });
 * ```
 */

export default testScenarios;
