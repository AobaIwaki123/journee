/**
 * 日付ユーティリティのテスト
 */

import {
  toSafeDate,
  getRelativeTime,
  formatDate,
  isValidDate,
} from '../date-utils';

describe('date-utils', () => {
  describe('toSafeDate', () => {
    it('Date オブジェクトをそのまま返す', () => {
      const date = new Date('2024-01-01');
      const result = toSafeDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(date.getTime());
    });

    it('文字列をDateオブジェクトに変換', () => {
      const result = toSafeDate('2024-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
    });

    it('数値（タイムスタンプ）をDateオブジェクトに変換', () => {
      const timestamp = 1704067200000; // 2024-01-01 00:00:00
      const result = toSafeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('null を返す（null入力）', () => {
      expect(toSafeDate(null)).toBeNull();
    });

    it('null を返す（undefined入力）', () => {
      expect(toSafeDate(undefined)).toBeNull();
    });

    it('null を返す（無効な文字列）', () => {
      expect(toSafeDate('invalid-date')).toBeNull();
    });

    it('null を返す（無効なDate）', () => {
      const invalidDate = new Date('invalid');
      expect(toSafeDate(invalidDate)).toBeNull();
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      // 固定の現在時刻を設定
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01 12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('「たった今」を返す（1分未満）', () => {
      const date = new Date('2024-01-01 11:59:30');
      expect(getRelativeTime(date)).toBe('たった今');
    });

    it('「X分前」を返す（1時間未満）', () => {
      const date = new Date('2024-01-01 11:30:00');
      expect(getRelativeTime(date)).toBe('30分前');
    });

    it('「X時間前」を返す（24時間未満）', () => {
      const date = new Date('2024-01-01 09:00:00');
      expect(getRelativeTime(date)).toBe('3時間前');
    });

    it('「X日前」を返す（7日未満）', () => {
      const date = new Date('2023-12-29 12:00:00');
      expect(getRelativeTime(date)).toBe('3日前');
    });

    it('「X週間前」を返す（4週間未満）', () => {
      const date = new Date('2023-12-18 12:00:00');
      expect(getRelativeTime(date)).toBe('2週間前');
    });

    it('「X ヶ月前」を返す（12ヶ月未満）', () => {
      const date = new Date('2023-10-01 12:00:00');
      expect(getRelativeTime(date)).toBe('3ヶ月前');
    });

    it('日付を返す（12ヶ月以上）', () => {
      const date = new Date('2022-01-01');
      const result = getRelativeTime(date);
      expect(result).toContain('2022');
    });

    it('「不明」を返す（無効な日付）', () => {
      expect(getRelativeTime('invalid-date')).toBe('不明');
    });

    it('「不明」を返す（null）', () => {
      expect(getRelativeTime(null)).toBe('不明');
    });
  });

  describe('formatDate', () => {
    it('full フォーマットで日付をフォーマット', () => {
      const date = new Date('2024-01-01');
      const result = formatDate(date, 'full');
      expect(result).toContain('2024');
      expect(result).toContain('1月');
    });

    it('short フォーマットで日付をフォーマット', () => {
      const date = new Date('2024-01-01');
      const result = formatDate(date, 'short');
      expect(result).toContain('2024');
    });

    it('datetime フォーマットで日付をフォーマット', () => {
      const date = new Date('2024-01-01 12:34:56');
      const result = formatDate(date, 'datetime');
      expect(result).toContain('2024');
      expect(result).toContain('12:34');
    });

    it('「不明」を返す（無効な日付）', () => {
      expect(formatDate('invalid-date')).toBe('不明');
    });

    it('「不明」を返す（null）', () => {
      expect(formatDate(null)).toBe('不明');
    });
  });

  describe('isValidDate', () => {
    it('true を返す（有効な Date）', () => {
      const date = new Date('2024-01-01');
      expect(isValidDate(date)).toBe(true);
    });

    it('true を返す（有効な文字列）', () => {
      expect(isValidDate('2024-01-01')).toBe(true);
    });

    it('true を返す（有効な数値）', () => {
      expect(isValidDate(1704067200000)).toBe(true);
    });

    it('false を返す（無効な文字列）', () => {
      expect(isValidDate('invalid-date')).toBe(false);
    });

    it('false を返す（無効な Date）', () => {
      const invalidDate = new Date('invalid');
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it('false を返す（null）', () => {
      expect(isValidDate(null)).toBe(false);
    });

    it('false を返す（undefined）', () => {
      expect(isValidDate(undefined)).toBe(false);
    });
  });
});
