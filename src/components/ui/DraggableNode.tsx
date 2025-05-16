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

  const divRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (divRef.current) {
      drag(divRef.current);
    }
  }, [drag]);

  return (
    <div
      ref={divRef}
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
