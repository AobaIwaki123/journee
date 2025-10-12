'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface AddressLinkProps {
  address: string;
  className?: string;
}

/**
 * 住所をクリック可能なリンクとして表示し、Google Mapsで開くコンポーネント
 */
export const AddressLink: React.FC<AddressLinkProps> = ({ address, className = '' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Google Maps検索URLを生成
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    
    // 新しいタブで開く
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 text-gray-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer ${className}`}
      title={`Google Mapsで「${address}」を開く`}
    >
      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
      <span className="truncate">{address}</span>
    </a>
  );
};
