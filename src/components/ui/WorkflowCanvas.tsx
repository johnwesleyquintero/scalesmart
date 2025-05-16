import { useDrop } from 'react-dnd';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

interface WorkflowCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
}

const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: WorkflowCanvasProps) => {
  const [, drop] = useDrop(() => ({
    accept: 'NODE',
    drop: (item: { type: string }) => {
      const newNode = {
        id: String(Math.random()),
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: item.type },
      };
      onNodesChange((nds: any[]) => nds.concat(newNode));
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div style={{ width: '100%', height: '100%', border: '1px dashed gray' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        ref={drop as any}
        fitView
      />
    </div>
  );
};

export default WorkflowCanvas;
