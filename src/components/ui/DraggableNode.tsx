import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils'; // Import cn utility

/**
 * Props for the DraggableNode component.
 */
interface DraggableNodeProps {
  /** The type of the draggable node, used as its identifier. */
  type: string;
  /** The label to display on the draggable node. */
  label: string;
}

/**
 * A component representing a draggable node, typically used in a workflow or diagram builder.
 * Built using @dnd-kit/core.
 * @see https://docs.dndkit.com/
 */
const DraggableNode: React.FC<DraggableNodeProps> = ({ type, label }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: type, // Use type as the ID for draggable nodes
    });

  const dynamicStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined; // No transform if not dragging

  const backgroundColorClass = isDragging ? 'bg-muted' : 'bg-card';

  return (
    <div
      ref={setNodeRef}
      style={dynamicStyle} // Apply dynamic transform style
      className={cn(
        'border border-solid border-[var(--border)] p-2.5', // Tailwind classes for border and padding
        backgroundColorClass,
      )}
      {...listeners}
      {...attributes}
    >
      {label}
    </div>
  );
};
export default DraggableNode;
