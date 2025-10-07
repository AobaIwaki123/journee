'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Calendar, MapPin, Edit2, Check, X } from 'lucide-react';

export const ItineraryHeader: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);
  const updateItinerary = useStore((state) => state.updateItinerary);
  const isEditingItinerary = useStore((state) => state.isEditingItinerary);
  const setEditingItinerary = useStore((state) => state.setEditingItinerary);

  const [editTitle, setEditTitle] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editSummary, setEditSummary] = useState('');

  if (!currentItinerary) return null;

  const handleStartEdit = () => {
    setEditTitle(currentItinerary.title);
    setEditDestination(currentItinerary.destination);
    setEditSummary(currentItinerary.summary || '');
    setEditingItinerary(true);
  };

  const handleSaveEdit = () => {
    updateItinerary({
      title: editTitle,
      destination: editDestination,
      summary: editSummary,
    });
    setEditingItinerary(false);
  };

  const handleCancelEdit = () => {
    setEditingItinerary(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 relative">
      {/* Edit Button */}
      {!isEditingItinerary && (
        <button
          onClick={handleStartEdit}
          className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="編集"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      )}

      {/* Edit Mode */}
      {isEditingItinerary ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">
              タイトル
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="旅のしおりのタイトル"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">
              目的地
            </label>
            <input
              type="text"
              value={editDestination}
              onChange={(e) => setEditDestination(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="目的地"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-1">
              概要
            </label>
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
              placeholder="旅の概要や目的など"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <Check className="w-4 h-4" />
              保存
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <h1 className="text-3xl font-bold mb-2">{currentItinerary.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-blue-100">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{currentItinerary.destination}</span>
            </div>
            {currentItinerary.startDate && currentItinerary.endDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                  {currentItinerary.startDate} - {currentItinerary.endDate}
                </span>
              </div>
            )}
            {currentItinerary.duration && (
              <div className="flex items-center">
                <span>{currentItinerary.duration}日間</span>
              </div>
            )}
          </div>
          {currentItinerary.summary && (
            <p className="mt-3 text-blue-50 text-sm">{currentItinerary.summary}</p>
          )}
        </>
      )}
    </div>
  );
};