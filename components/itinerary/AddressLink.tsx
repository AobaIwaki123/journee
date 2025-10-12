'use client';

import React, { memo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface AddressLinkProps {
  address: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * 住所をクリック可能なリンクとして表示するコンポーネント
 * クリックするとGoogle Mapsで住所を検索
 */
export const AddressLink: React.FC<AddressLinkProps> = memo(({ 
  address, 
  className = '',
  showIcon = true 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors ${className}`}
      title={`"${address}"をGoogle Mapsで開く`}
      type="button"
    >
      {showIcon && <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />}
      <span className="truncate hover:underline">{address}</span>
      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
});

AddressLink.displayName = 'AddressLink';
