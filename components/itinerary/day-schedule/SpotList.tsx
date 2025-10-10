/**
 * Phase 9.4: SpotList
 * 
 * スポットリスト（D&D対応）
 */

'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { TouristSpot } from '@/types/itinerary';
import { SpotCard } from '../SpotCard';

interface SpotListProps {
  spots: TouristSpot[];
  dayIndex: number;
  editable: boolean;
  onDragEnd: (result: DropResult) => void;
}

export const SpotList: React.FC<SpotListProps> = ({
  spots,
  dayIndex,
  editable,
  onDragEnd,
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`day-${dayIndex}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 ${
              snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
            }`}
          >
            {spots.map((spot, spotIndex) => (
              <Draggable
                key={spot.id}
                draggableId={spot.id}
                index={spotIndex}
                isDragDisabled={!editable}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'opacity-50' : ''}
                  >
                    <SpotCard
                      spot={spot}
                      dayIndex={dayIndex}
                      spotIndex={spotIndex}
                      editable={editable}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
