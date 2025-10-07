'use client';

import React, { useState } from 'react';
import { DaySchedule as DayScheduleType, TouristSpot } from '@/types/itinerary';
import { SpotCard } from './SpotCard';
import { MapPin, DollarSign, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DayScheduleProps {
  day: DayScheduleType;
  onEdit?: (day: DayScheduleType) => void;
  isEditable?: boolean;
}

export const DaySchedule: React.FC<DayScheduleProps> = ({ 
  day, 
  onEdit,
  isEditable = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(day.title || `${day.day}日目`);

  const handleSpotEdit = (editedSpot: TouristSpot) => {
    if (!onEdit) return;
    
    const updatedSpots = day.spots.map(spot =>
      spot.id === editedSpot.id ? editedSpot : spot
    );
    
    onEdit({ ...day, spots: updatedSpots });
  };

  const handleSaveTitle = () => {
    if (onEdit && editedTitle.trim()) {
      onEdit({ ...day, title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(day.title || `${day.day}日目`);
    setIsEditing(false);
  };

  // Calculate statistics
  const totalSpots = day.spots.length;
  const totalDuration = day.spots.reduce((sum, spot) => sum + (spot.duration || 0), 0);
  const categories = [...new Set(day.spots.map(spot => spot.category).filter(Boolean))];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="bg-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-lg mr-4 shadow-md">
              Day{day.day}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 px-3 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                    aria-label="保存"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    aria-label="キャンセル"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {day.title || `${day.day}日目`}
                  </h3>
                  {isEditable && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      aria-label="タイトルを編集"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              {day.date && (
                <p className="text-sm text-gray-600 mt-1">{day.date}</p>
              )}
              {/* Quick Stats */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {totalSpots} スポット
                </span>
                {totalDuration > 0 && (
                  <span>
                    滞在時間: {Math.floor(totalDuration / 60)}時間{totalDuration % 60}分
                  </span>
                )}
                {categories.length > 0 && (
                  <span className="hidden sm:inline">
                    {categories.length} カテゴリ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Day summary */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 ml-4">
            {day.totalCost !== undefined && day.totalCost > 0 && (
              <div className="text-right bg-white px-3 py-2 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">予算</p>
                <p className="font-semibold text-blue-600">
                  ¥{day.totalCost.toLocaleString()}
                </p>
              </div>
            )}
            {day.totalDistance !== undefined && day.totalDistance > 0 && (
              <div className="text-right bg-white px-3 py-2 rounded-lg shadow-sm">
                <p className="text-xs text-gray-500">移動距離</p>
                <p className="font-semibold text-indigo-600">{day.totalDistance}km</p>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label={isExpanded ? '折りたたむ' : '展開する'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Spots */}
      {isExpanded && (
        <div className="p-6">
          {day.spots.length > 0 ? (
            <div className="space-y-4">
              {day.spots.map((spot, index) => (
                <React.Fragment key={spot.id}>
                  <SpotCard 
                    spot={spot} 
                    isEditable={isEditable}
                    onEdit={handleSpotEdit}
                  />
                  {index < day.spots.length - 1 && (
                    <div className="flex items-center justify-center my-2">
                      <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-gray-100"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500 text-sm border-2 border-dashed border-gray-300">
              <p className="font-medium">この日のスケジュールはまだ設定されていません</p>
              <p className="text-xs mt-1">AIチャットで詳細を追加してみましょう</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
