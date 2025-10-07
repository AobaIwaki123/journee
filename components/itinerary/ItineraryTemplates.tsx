'use client';

import React from 'react';
import { ItineraryData } from '@/types/itinerary';
import { Sparkles, Map, Camera, Utensils, Mountain } from 'lucide-react';

export type TemplateType = 'standard' | 'photo' | 'foodie' | 'adventure' | 'culture';

interface Template {
  id: TemplateType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

const templates: Template[] = [
  {
    id: 'standard',
    name: 'スタンダード',
    description: 'バランスの取れた定番スタイル',
    icon: <Map className="w-6 h-6" />,
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'photo',
    name: 'フォトジェニック',
    description: '写真映えスポット中心',
    icon: <Camera className="w-6 h-6" />,
    color: 'text-pink-600',
    bgGradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'foodie',
    name: 'グルメ旅',
    description: '美食とレストラン巡り',
    icon: <Utensils className="w-6 h-6" />,
    color: 'text-orange-600',
    bgGradient: 'from-orange-500 to-red-600',
  },
  {
    id: 'adventure',
    name: 'アドベンチャー',
    description: 'アクティビティとアウトドア',
    icon: <Mountain className="w-6 h-6" />,
    color: 'text-green-600',
    bgGradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'culture',
    name: '文化体験',
    description: '歴史・文化スポット重視',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-purple-600',
    bgGradient: 'from-purple-500 to-indigo-600',
  },
];

interface ItineraryTemplatesProps {
  onSelect: (template: TemplateType) => void;
  currentTemplate?: TemplateType;
}

export const ItineraryTemplates: React.FC<ItineraryTemplatesProps> = ({
  onSelect,
  currentTemplate = 'standard',
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">しおりのスタイル</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`relative p-5 rounded-xl text-left transition-all duration-200 ${
              currentTemplate === template.id
                ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
                : 'hover:shadow-md hover:scale-102 bg-white border-2 border-gray-200'
            }`}
          >
            {/* Background gradient when selected */}
            {currentTemplate === template.id && (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${template.bgGradient} opacity-10 rounded-xl`}
              />
            )}

            <div className="relative">
              <div
                className={`inline-flex p-3 rounded-lg mb-3 ${
                  currentTemplate === template.id
                    ? `bg-gradient-to-br ${template.bgGradient} text-white`
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {template.icon}
              </div>

              <h4 className="font-semibold text-gray-900 mb-1">
                {template.name}
              </h4>
              <p className="text-sm text-gray-600">{template.description}</p>

              {currentTemplate === template.id && (
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  選択中
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 テンプレートとは？</strong>
          <br />
          しおりのスタイルを選ぶと、AIが提案する内容やデザインがそれに合わせて調整されます。
          後から変更することも可能です。
        </p>
      </div>
    </div>
  );
};

/**
 * Get template system prompt based on template type
 */
export const getTemplatePrompt = (template: TemplateType): string => {
  const prompts: Record<TemplateType, string> = {
    standard: '観光、食事、移動をバランスよく組み合わせた定番の旅程を提案してください。',
    photo: 'インスタ映えするフォトジェニックなスポットを中心に、写真撮影に最適な時間帯を考慮した旅程を提案してください。',
    foodie: '地元の名物料理や人気レストラン、食べ歩きスポットを中心に、美食を楽しむ旅程を提案してください。',
    adventure: 'アクティビティやアウトドア体験を中心に、アクティブで冒険心をくすぐる旅程を提案してください。',
    culture: '歴史的建造物、博物館、伝統文化体験を中心に、深く学べる旅程を提案してください。',
  };

  return prompts[template];
};