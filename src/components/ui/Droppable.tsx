import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  type: string;
  onDrop: (item: string) => void;
  children: React.ReactNode;
}

import { useCallback } from 'react';

const Droppable: React.FC<DroppableProps> = ({ onDrop, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable-area', // A unique ID for the droppable area
  });

  return (
    <div
      ref={setNodeRef}
      style={{ backgroundColor: isOver ? 'lightgreen' : 'white' }}
    >
      {children}
    </div>
  );
};

export default Droppable;
