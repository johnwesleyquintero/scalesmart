import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  id: string; // Add id to DroppableProps
  children: React.ReactNode;
}

const Droppable: React.FC<DroppableProps> = ({ id, children }) => {
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
