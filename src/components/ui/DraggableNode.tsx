import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableNodeProps {
  type: string;
  label: string;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ type, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NODE',
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      style={{
        border: '1px solid black',
        padding: '10px',
        backgroundColor: isDragging ? 'lightgray' : 'white',
      }}
    >
      {label}
    </div>
  );
};

export default DraggableNode;
