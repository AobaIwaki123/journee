/**
 * Phase 7.1: カテゴリユーティリティ
 * 
 * スポットカテゴリに関連するヘルパー関数とデータを一元管理
 */

import React from 'react';
import { Camera, Utensils, Car, Hotel, Sparkles, ShoppingBag, Activity } from 'lucide-react';

// カテゴリ型定義
export type SpotCategory = 
  | 'sightseeing'
  | 'restaurant'
  | 'hotel'
  | 'shopping'
  | 'transport'
  | 'activity'
  | 'other';

// カテゴリ定義
export const CATEGORY_LABELS: Record<SpotCategory, string> = {
  sightseeing: '観光',
  restaurant: 'レストラン',
  hotel: '宿泊',
  shopping: 'ショッピング',
  transport: '移動',
  activity: 'アクティビティ',
  other: 'その他',
};

export const CATEGORY_COLORS: Record<SpotCategory, string> = {
  sightseeing: 'bg-blue-100 text-blue-700 border-blue-200',
  restaurant: 'bg-orange-100 text-orange-700 border-orange-200',
  hotel: 'bg-purple-100 text-purple-700 border-purple-200',
  shopping: 'bg-pink-100 text-pink-700 border-pink-200',
  transport: 'bg-green-100 text-green-700 border-green-200',
  activity: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const CATEGORY_GRADIENTS: Record<SpotCategory, string> = {
  sightseeing: 'from-blue-500 to-blue-600',
  restaurant: 'from-orange-500 to-orange-600',
  hotel: 'from-purple-500 to-purple-600',
  shopping: 'from-pink-500 to-pink-600',
  transport: 'from-green-500 to-green-600',
  activity: 'from-yellow-500 to-yellow-600',
  other: 'from-gray-500 to-gray-600',
};

export const CATEGORY_ICONS: Record<SpotCategory, React.ComponentType<{ className?: string }>> = {
  sightseeing: Camera,
  restaurant: Utensils,
  hotel: Hotel,
  shopping: ShoppingBag,
  transport: Car,
  activity: Activity,
  other: Sparkles,
};

// カテゴリ選択オプション
export const CATEGORY_OPTIONS: Array<{ value: SpotCategory; label: string }> = [
  { value: 'sightseeing', label: '観光' },
  { value: 'restaurant', label: 'レストラン' },
  { value: 'hotel', label: '宿泊' },
  { value: 'shopping', label: 'ショッピング' },
  { value: 'transport', label: '移動' },
  { value: 'activity', label: 'アクティビティ' },
  { value: 'other', label: 'その他' },
];

/**
 * カテゴリの日本語ラベルを取得
 */
export function getCategoryLabel(category?: string): string {
  if (!category) return '';
  return CATEGORY_LABELS[category as SpotCategory] || 'その他';
}

/**
 * カテゴリのTailwindカラークラスを取得
 */
export function getCategoryColor(category?: string): string {
  if (!category) return CATEGORY_COLORS.other;
  return CATEGORY_COLORS[category as SpotCategory] || CATEGORY_COLORS.other;
}

/**
 * カテゴリのグラデーションクラスを取得
 */
export function getCategoryGradient(category?: string): string {
  if (!category) return CATEGORY_GRADIENTS.other;
  return CATEGORY_GRADIENTS[category as SpotCategory] || CATEGORY_GRADIENTS.other;
}

/**
 * カテゴリのアイコンコンポーネントを取得
 */
export function getCategoryIconComponent(category?: string): React.ComponentType<{ className?: string }> {
  return category 
    ? CATEGORY_ICONS[category as SpotCategory] || CATEGORY_ICONS.other
    : CATEGORY_ICONS.other;
}

/**
 * カテゴリのアイコンをJSXとして取得
 */
export function getCategoryIcon(category?: string, className: string = 'w-5 h-5'): JSX.Element {
  const Icon = getCategoryIconComponent(category);
  return React.createElement(Icon, { className });
}
