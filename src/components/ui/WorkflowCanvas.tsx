import React from 'react';
import { useDrop } from 'react-dnd';
import ReactFlow, {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Node, Edge } from '@/lib/workflow/types';

interface WorkflowCanvasProps {
  nodes: (Node | ReactFlowNode)[];
  edges: (Edge | ReactFlowEdge)[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
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
      onNodesChange([
        {
          type: 'add',
          item: newNode,
        },
      ]);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const dropRef = React.useCallback(
    (node: HTMLDivElement) => {
      drop(node);
    },
    [drop],
  );

  return (
    <div style={{ width: '100%', height: '100%', border: '1px dashed gray' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        ref={dropRef}
        fitView
      />
    </div>
  );
};

export default WorkflowCanvas;
