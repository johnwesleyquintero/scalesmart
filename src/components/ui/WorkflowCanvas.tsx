import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DragEndEvent } from '@dnd-kit/core';
import ReactFlow, {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  useReactFlow, // Import useReactFlow
  ReactFlowProvider, // Import ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Node, Edge } from '@/lib/workflow/types';

interface WorkflowCanvasProps {
  nodes: (Node | ReactFlowNode)[];
  edges: (Edge | ReactFlowEdge)[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDrop: (type: string, position: { x: number; y: number }) => void; // New prop
}

const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDrop, // Destructure new prop
}: WorkflowCanvasProps) => {
  const { setNodeRef } = useDroppable({
    id: 'workflow-canvas',
  });

  const reactFlowInstance = useReactFlow(); // Get reactFlowInstance from hook

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault(); // Essential to allow dropping
    if (event.dataTransfer.types.includes('nodeType')) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('nodeType'); // Get the node type
    // Use the screen coordinates and convert to flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    if (type) {
      onNodeDrop(type, position); // Call the onNodeDrop callback with type and position
    }
  };

  return (
    <ReactFlowProvider>
      <div
        ref={setNodeRef}
        style={{ width: '100%', height: '100%', border: '1px dashed gray' }}
        onDragOver={handleDragOver} // Handle drag over
        onDrop={handleDrop} // Handle drop
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
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;
