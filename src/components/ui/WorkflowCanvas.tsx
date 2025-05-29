import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DragEndEvent } from '@dnd-kit/core';
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
  const { setNodeRef } = useDroppable({
    id: 'workflow-canvas',
  });

  // This function will be called by the DndContext's onDragEnd
  // It's passed down from WorkflowBuilderPage
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (
      active.id.toString().startsWith('node-') &&
      over?.id === 'workflow-canvas'
    ) {
      // This is a simplified example. In a real app, you'd get the drop position
      // and create a new node at that position.
      const newNode = {
        id: String(Math.random()),
        type: active.id.toString().replace('node-', ''), // Extract type from draggable ID
        position: { x: Math.random() * 200, y: Math.random() * 200 }, // Placeholder position
        data: { label: active.id.toString().replace('node-', '') + ' Node' },
      };
      onNodesChange([
        {
          type: 'add',
          item: newNode,
        },
      ]);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ width: '100%', height: '100%', border: '1px dashed gray' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
};

export default WorkflowCanvas;
