import React from 'react';
import { Draggable, DraggableProvided } from 'react-beautiful-dnd';

interface DraggableItemProps {
  id: string;
  index: number;
  children: React.ReactNode;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  index,
  children,
}) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided: DraggableProvided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="text-gray-400 dark:text-gray-500 cursor-grab hover:text-primary-500">
            ≡
          </div>
          {children}
        </div>
      )}
    </Draggable>
  );
};
