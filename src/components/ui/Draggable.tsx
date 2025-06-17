import React from 'react';
import { useDraggable } from '@dnd-kit/core';

/**
 * Props for the Draggable component.
 */
interface DraggableProps {
  /** The unique identifier for the draggable item. */
  id: string;
  /** The type of the draggable item. */
  type: string;
  /** Optional data associated with the draggable item. */
  data?: Record<string, unknown>;
  /** The content to be rendered as the draggable element. */
  children: React.ReactNode;
}

import { useCallback } from 'react';

/**
 * A component that makes its children draggable.
 * Built using @dnd-kit/core.
 * @see https://docs.dndkit.com/
 */
const Draggable: React.FC<DraggableProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : { opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

export default Draggable;
