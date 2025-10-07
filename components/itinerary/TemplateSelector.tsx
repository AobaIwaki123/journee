'use client';

import React from 'react';
import { TEMPLATES, type TemplateId } from '@/types/template';
import { useStore } from '@/lib/store/useStore';
import { Check } from 'lucide-react';

export const TemplateSelector: React.FC = () => {
  const selectedTemplate = useStore((state) => state.selectedTemplate);
  const setSelectedTemplate = useStore((state) => state.setSelectedTemplate);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3">
        デザインテンプレート
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        しおりの見た目を選択してください
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(TEMPLATES).map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }
            `}
          >
            {/* Selected Indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            {/* Template Icon */}
            <div className="text-4xl mb-2 text-center">{template.icon}</div>

            {/* Template Name */}
            <div className="font-bold text-gray-900 mb-1 text-center">
              {template.name}
            </div>

            {/* Template Description */}
            <div className="text-xs text-gray-600 text-center">
              {template.description}
            </div>

            {/* Color Preview */}
            <div className="flex justify-center gap-1 mt-3">
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: template.colors.primary }}
                title="Primary"
              />
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: template.colors.secondary }}
                title="Secondary"
              />
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: template.colors.accent }}
                title="Accent"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};