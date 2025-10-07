'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { ChatBox } from '@/components/chat/ChatBox';
import { ItineraryPreview } from '@/components/itinerary/ItineraryPreview';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Box - Left Side (40%) */}
        <div className="w-2/5 border-r border-gray-200">
          <ChatBox />
        </div>

        {/* Itinerary Preview - Right Side (60%) */}
        <div className="w-3/5">
          <ItineraryPreview />
        </div>
      </div>
    </div>
  );
}
