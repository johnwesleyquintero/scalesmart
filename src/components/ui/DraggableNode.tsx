import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableNodeProps {
  type: string;
  label: string;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ type, label }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: type, // Use type as the ID for draggable nodes
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        border: '1px solid var(--border)',
        padding: '10px',
      }
    : {
        border: '1px solid var(--border)',
        padding: '10px',
      };

  const backgroundColorClass = isDragging ? 'bg-muted' : 'bg-card';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={backgroundColorClass}
      {...listeners}
      {...attributes}
    >
      {label}
    </div>
  );
};
export default DraggableNode;
