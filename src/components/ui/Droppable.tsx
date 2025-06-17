import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils'; // Import cn utility

/**
 * Props for the Droppable component.
 */
interface DroppableProps {
  /** The unique identifier for the droppable area. */
  id: string;
  /** The content to be rendered within the droppable area. */
  children: React.ReactNode;
}

/**
 * A component that defines an area where draggable items can be dropped.
 * Built using @dnd-kit/core.
 * @see https://docs.dndkit.com/
 */
const Droppable: React.FC<DroppableProps> = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable-area', // A unique ID for the droppable area
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors duration-200', // Add transition for smooth color change
        isOver ? 'bg-green-100 dark:bg-green-900' : 'bg-white dark:bg-gray-800',
      )}
    >
      {children}
    </div>
  );
};

export default Droppable;
