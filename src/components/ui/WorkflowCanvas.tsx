import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DragEndEvent } from '@dnd-kit/core';
import ReactFlow, {
  Node as ReactFlowNode, // Alias Node from reactflow to avoid conflict
  Edge as ReactFlowEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  useReactFlow,
  NodeMouseHandler, // Import NodeMouseHandler for onNodeClick
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Node, Edge } from '@/lib/workflow/types';

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDrop: (type: string, position: { x: number; y: number }) => void;
  onNodeClick: NodeMouseHandler;
  onPaneClick: (event: React.MouseEvent) => void; // Corrected: Using React.MouseEvent for pane click
}

const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDrop,
  onNodeClick,
  onPaneClick,
}: WorkflowCanvasProps) => {
  const { setNodeRef } = useDroppable({
    id: 'workflow-canvas',
  });

  const reactFlowInstance = useReactFlow();

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes('nodeType')) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('nodeType');
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    if (type) {
      onNodeDrop(type, position);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ width: '100%', height: '100%', border: '1px dashed gray' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes as ReactFlowNode[]} // Cast to ReactFlowNode[] to resolve type incompatibility
        edges={edges as ReactFlowEdge[]} // Cast edges similarly
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
      />
    </div>
  );
};

export default WorkflowCanvas;
