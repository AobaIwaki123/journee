/**
 * itinerary-validation のユニットテスト
 */

import {
  validateSpot,
  validateItinerary,
  validateDaySchedule,
  validate,
  SPOT_VALIDATION_RULES,
  ITINERARY_VALIDATION_RULES,
  DAY_SCHEDULE_VALIDATION_RULES,
} from '../itinerary-validation';

describe('itinerary-validation', () => {
  describe('validateSpot', () => {
    it('有効なスポットを検証する', () => {
      const spot = {
        name: 'Test Spot',
        description: 'Test description',
        scheduledTime: '14:30',
        duration: 120,
        estimatedCost: 1000,
        notes: 'Test notes',
      };

      const result = validateSpot(spot);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('名前が空の場合にエラーを返す', () => {
      const spot = {
        name: '',
        description: 'Test description',
      };

      const result = validateSpot(spot);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.fieldErrors?.name).toBeDefined();
    });

    it('説明が500文字を超える場合にエラーを返す', () => {
      const spot = {
        name: 'Test',
        description: 'a'.repeat(501),
      };

      const result = validateSpot(spot);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('500文字'))).toBe(true);
    });

    it('無効な時刻形式の場合にエラーを返す', () => {
      const spot = {
        name: 'Test',
        description: 'Test',
        scheduledTime: '25:70',
      };

      const result = validateSpot(spot);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('HH:mm形式'))).toBe(true);
    });

    it('滞在時間が負の場合にエラーを返す', () => {
      const spot = {
        name: 'Test',
        description: 'Test',
        duration: -10,
      };

      const result = validateSpot(spot);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('0以上'))).toBe(true);
    });

    it('滞在時間が24時間を超える場合にエラーを返す', () => {
      const spot = {
        name: 'Test',
        description: 'Test',
        duration: 1500,
      };

      const result = validateSpot(spot);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('1440分'))).toBe(true);
    });
  });

  describe('validateItinerary', () => {
    it('有効なしおりを検証する', () => {
      const itinerary = {
        title: 'Test Itinerary',
        destination: 'Tokyo',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        summary: 'Test summary',
      };

      const result = validateItinerary(itinerary);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('タイトルが空の場合にエラーを返す', () => {
      const itinerary = {
        title: '',
        destination: 'Tokyo',
      };

      const result = validateItinerary(itinerary);

      expect(result.valid).toBe(false);
      expect(result.fieldErrors?.title).toBeDefined();
    });

    it('行き先が100文字を超える場合にエラーを返す', () => {
      const itinerary = {
        title: 'Test',
        destination: 'a'.repeat(101),
      };

      const result = validateItinerary(itinerary);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('50文字'))).toBe(true);
    });

    it('無効な日付形式の場合にエラーを返す', () => {
      const itinerary = {
        title: 'Test',
        destination: 'Tokyo',
        startDate: '2024/01/01', // スラッシュ区切りは無効
      };

      const result = validateItinerary(itinerary);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('YYYY-MM-DD'))).toBe(true);
    });
  });

  describe('validateDaySchedule', () => {
    it('有効な日程を検証する', () => {
      const daySchedule = {
        day: 1,
        title: 'Day 1 Title',
        theme: 'Sightseeing',
      };

      const result = validateDaySchedule(daySchedule);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('日目が0以下の場合にエラーを返す', () => {
      const daySchedule = {
        day: 0,
      };

      const result = validateDaySchedule(daySchedule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('1〜365'))).toBe(true);
    });

    it('日目が365を超える場合にエラーを返す', () => {
      const daySchedule = {
        day: 400,
      };

      const result = validateDaySchedule(daySchedule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('1〜365'))).toBe(true);
    });

    it('タイトルが100文字を超える場合にエラーを返す', () => {
      const daySchedule = {
        day: 1,
        title: 'a'.repeat(101),
      };

      const result = validateDaySchedule(daySchedule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('100文字'))).toBe(true);
    });
  });

  describe('validate (汎用関数)', () => {
    it('複数のルール違反がある場合、すべてのエラーを返す', () => {
      const data = {
        name: '',
        description: 'a'.repeat(501),
        duration: -10,
      };

      const result = validate(data, SPOT_VALIDATION_RULES);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.fieldErrors).toBeDefined();
    });

    it('オプショナルフィールドが未設定でもエラーにならない', () => {
      const data = {
        name: 'Test',
        description: 'Test description',
      };

      const result = validate(data, SPOT_VALIDATION_RULES);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('正規表現パターンマッチングが機能する', () => {
      const data = {
        name: 'Test',
        description: 'Test',
        scheduledTime: '14:30',
      };

      const result = validate(data, SPOT_VALIDATION_RULES);

      expect(result.valid).toBe(true);
    });

    it('範囲チェックが機能する', () => {
      const data = {
        name: 'Test',
        description: 'Test',
        duration: 120,
        estimatedCost: 1000,
      };

      const result = validate(data, SPOT_VALIDATION_RULES);

      expect(result.valid).toBe(true);
    });
  });
});
