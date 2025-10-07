/**
 * しおりテンプレート関連の型定義
 */

export type TemplateId = 'classic' | 'modern' | 'minimal';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: 'compact' | 'normal' | 'spacious';
}

export const TEMPLATES: Record<TemplateId, Template> = {
  classic: {
    id: 'classic',
    name: 'クラシック',
    description: 'シンプルで読みやすい伝統的なデザイン',
    icon: '📖',
    colors: {
      primary: '#2563eb', // blue-600
      secondary: '#7c3aed', // violet-600
      accent: '#059669', // emerald-600
      background: '#f9fafb', // gray-50
      text: '#1f2937', // gray-800
      border: '#e5e7eb', // gray-200
    },
    fonts: {
      heading: 'font-serif',
      body: 'font-sans',
    },
    spacing: 'normal',
  },
  modern: {
    id: 'modern',
    name: 'モダン',
    description: 'カラフルでビジュアル重視のデザイン',
    icon: '🎨',
    colors: {
      primary: '#f59e0b', // amber-500
      secondary: '#ec4899', // pink-500
      accent: '#8b5cf6', // violet-500
      background: '#fef3c7', // amber-100
      text: '#78350f', // amber-900
      border: '#fcd34d', // amber-300
    },
    fonts: {
      heading: 'font-bold',
      body: 'font-normal',
    },
    spacing: 'spacious',
  },
  minimal: {
    id: 'minimal',
    name: 'ミニマル',
    description: '白黒・印刷向けのシンプルデザイン',
    icon: '⚪',
    colors: {
      primary: '#000000', // black
      secondary: '#374151', // gray-700
      accent: '#6b7280', // gray-500
      background: '#ffffff', // white
      text: '#000000', // black
      border: '#d1d5db', // gray-300
    },
    fonts: {
      heading: 'font-bold',
      body: 'font-normal',
    },
    spacing: 'compact',
  },
};