/**
 * しおり関連のバリデーションルール（Phase 4: 型定義の整理）
 * 
 * しおり、日程、スポットのバリデーションルールを定義
 */

/**
 * バリデーションルールの基本型
 */
export interface ValidationRule<T = any> {
  /** 必須フィールドかどうか */
  required?: boolean;
  /** 最小長 */
  minLength?: number;
  /** 最大長 */
  maxLength?: number;
  /** 最小値 */
  min?: number;
  /** 最大値 */
  max?: number;
  /** 正規表現パターン */
  pattern?: RegExp;
  /** カスタムバリデーション関数 */
  validate?: (value: T) => boolean | string;
  /** エラーメッセージ */
  message?: string;
}

/**
 * フィールドごとのバリデーションルール
 */
export type FieldValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

/**
 * スポットのバリデーションルール
 */
export const SPOT_VALIDATION_RULES: FieldValidationRules<{
  name: string;
  description: string;
  scheduledTime?: string;
  duration?: number;
  estimatedCost?: number;
  notes?: string;
}> = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'スポット名は1〜100文字で入力してください',
  },
  description: {
    required: true,
    minLength: 1,
    maxLength: 500,
    message: '説明は1〜500文字で入力してください',
  },
  scheduledTime: {
    required: false,
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    message: '予定時刻はHH:mm形式で入力してください',
  },
  duration: {
    required: false,
    min: 0,
    max: 1440, // 24時間 = 1440分
    message: '滞在時間は0〜1440分（24時間）で入力してください',
  },
  estimatedCost: {
    required: false,
    min: 0,
    max: 10000000, // 1000万円
    message: '予算は0〜10,000,000円で入力してください',
  },
  notes: {
    required: false,
    maxLength: 1000,
    message: 'メモは1000文字以内で入力してください',
  },
};

/**
 * しおりのバリデーションルール
 */
export const ITINERARY_VALIDATION_RULES: FieldValidationRules<{
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
}> = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'タイトルは1〜100文字で入力してください',
  },
  destination: {
    required: true,
    minLength: 1,
    maxLength: 50,
    message: '行き先は1〜50文字で入力してください',
  },
  startDate: {
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: '開始日はYYYY-MM-DD形式で入力してください',
  },
  endDate: {
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    validate: (endDate) => {
      // endDateがstartDateより後であることを確認（実装時に追加）
      return true;
    },
    message: '終了日はYYYY-MM-DD形式で、開始日より後の日付を入力してください',
  },
  summary: {
    required: false,
    maxLength: 1000,
    message: '概要は1000文字以内で入力してください',
  },
};

/**
 * 日程のバリデーションルール
 */
export const DAY_SCHEDULE_VALIDATION_RULES: FieldValidationRules<{
  day: number;
  title?: string;
  theme?: string;
}> = {
  day: {
    required: true,
    min: 1,
    max: 365, // 最大1年
    message: '日目は1〜365の範囲で指定してください',
  },
  title: {
    required: false,
    maxLength: 100,
    message: 'タイトルは100文字以内で入力してください',
  },
  theme: {
    required: false,
    maxLength: 200,
    message: 'テーマは200文字以内で入力してください',
  },
};

/**
 * バリデーション結果
 */
export interface ValidationResult {
  /** バリデーション成功フラグ */
  valid: boolean;
  /** エラーメッセージのリスト */
  errors: string[];
  /** フィールドごとのエラー */
  fieldErrors?: Record<string, string>;
}

/**
 * 汎用バリデーション関数
 * 
 * @param data - バリデーション対象のデータ
 * @param rules - バリデーションルール
 * @returns バリデーション結果
 */
export function validate<T extends Record<string, any>>(
  data: Partial<T>,
  rules: FieldValidationRules<T>
): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules) as [keyof T, ValidationRule][]) {
    const value = data[field];

    // 必須チェック
    if (rule.required && (value === undefined || value === null || value === '')) {
      const error = rule.message || `${String(field)}は必須です`;
      errors.push(error);
      fieldErrors[String(field)] = error;
      continue;
    }

    // 値が存在しない場合はスキップ
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // 文字列の長さチェック
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        const error = rule.message || `${String(field)}は${rule.minLength}文字以上で入力してください`;
        errors.push(error);
        fieldErrors[String(field)] = error;
        continue;
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        const error = rule.message || `${String(field)}は${rule.maxLength}文字以内で入力してください`;
        errors.push(error);
        fieldErrors[String(field)] = error;
        continue;
      }
    }

    // 数値の範囲チェック
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        const error = rule.message || `${String(field)}は${rule.min}以上で入力してください`;
        errors.push(error);
        fieldErrors[String(field)] = error;
        continue;
      }
      if (rule.max !== undefined && value > rule.max) {
        const error = rule.message || `${String(field)}は${rule.max}以下で入力してください`;
        errors.push(error);
        fieldErrors[String(field)] = error;
        continue;
      }
    }

    // 正規表現パターンチェック
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        const error = rule.message || `${String(field)}の形式が正しくありません`;
        errors.push(error);
        fieldErrors[String(field)] = error;
        continue;
      }
    }

    // カスタムバリデーション
    if (rule.validate) {
      const result = rule.validate(value);
      if (result !== true) {
        const error = typeof result === 'string' ? result : (rule.message || `${String(field)}が無効です`);
        errors.push(error);
        fieldErrors[String(field)] = error;
        continue;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

/**
 * スポットのバリデーション
 */
export function validateSpot(spot: Partial<{
  name: string;
  description: string;
  scheduledTime?: string;
  duration?: number;
  estimatedCost?: number;
  notes?: string;
}>): ValidationResult {
  return validate(spot, SPOT_VALIDATION_RULES);
}

/**
 * しおりのバリデーション
 */
export function validateItinerary(itinerary: Partial<{
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
}>): ValidationResult {
  return validate(itinerary, ITINERARY_VALIDATION_RULES);
}

/**
 * 日程のバリデーション
 */
export function validateDaySchedule(daySchedule: Partial<{
  day: number;
  title?: string;
  theme?: string;
}>): ValidationResult {
  return validate(daySchedule, DAY_SCHEDULE_VALIDATION_RULES);
}
