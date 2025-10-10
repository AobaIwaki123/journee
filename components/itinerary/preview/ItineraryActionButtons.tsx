/**
 * Phase 8: ItineraryActionButtons
 * 
 * Share/Save/Resetボタン群のコンポーネント
 */

'use client';

import React from 'react';
import { ShareButton } from '../ShareButton';
import { SaveButton } from '../SaveButton';
import { ResetButton } from '../ResetButton';

export const ItineraryActionButtons: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      <ShareButton />
      <SaveButton />
      <ResetButton />
    </div>
  );
};
