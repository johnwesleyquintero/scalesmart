'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Panel,
  MiniMap,
  ReactFlowProvider,
  BackgroundVariant, // Import BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowBuilderData } from '@/hooks/use-workflow-builder-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NodeConfigForm } from '@/lib/workflow/node-config-form'; // Assuming this component exists

// Custom Node components (if any, for now just default)
// import StartNode from '@/lib/workflow/nodes/StartNode';
// import LogNode from '@/lib/workflow/nodes/LogNode';
// import EndNode from '@/lib/workflow/nodes/EndNode';

// const nodeTypes = {
//   start: StartNode,
//   log: LogNode,
//   end: EndNode,
//   // Add other custom nodes here
// };

const WorkflowBuilderSection: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    onNodesChange,
    edges,
    onEdgesChange,
    onConnect,
    onNodeDrop,
    registeredNodeTypes,
    saveWorkflow,
    loadWorkflow,
    handleExecuteWorkflow,
    selectedNode,
    handleNodeDataChange,
    selectedNodeTypeDef,
  } = useWorkflowBuilderData();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (reactFlowWrapper.current) {
        const reactFlowBounds =
          reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');

        // calculate where to drop the node
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        if (type) {
          onNodeDrop(type, position);
        }
      }
    },
    [onNodeDrop],
  );

  useEffect(() => {
    // Load workflow on component mount
    loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="flex h-[700px] w-full">
      <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            // nodeTypes={nodeTypes} // Uncomment and define custom nodeTypes if needed
          >
            <MiniMap />
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-left" className="flex flex-col gap-2 p-2">
              <Button onClick={saveWorkflow}>Save Workflow</Button>
              <Button onClick={loadWorkflow}>Load Workflow</Button>
              <Button onClick={handleExecuteWorkflow}>Execute Workflow</Button>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <Card className="w-80 p-4 ml-4 flex-shrink-0 overflow-y-auto">
        <CardHeader>
          <CardTitle>Node Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Drag nodes to the canvas:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {registeredNodeTypes.map((nodeType) => (
              <div
                key={nodeType.type}
                className="p-2 border rounded-md cursor-grab bg-secondary text-secondary-foreground text-center"
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    'application/reactflow',
                    nodeType.type,
                  );
                  event.dataTransfer.effectAllowed = 'move';
                }}
                draggable
              >
                {nodeType.label}
              </div>
            ))}
          </div>
        </CardContent>

        {selectedNode && selectedNodeTypeDef && (
          <CardContent className="mt-6 border-t pt-4">
            <CardTitle className="mb-4">Node Properties</CardTitle>
            <NodeConfigForm
              node={selectedNode}
              nodeTypeDef={selectedNodeTypeDef}
              onDataChange={handleNodeDataChange}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default WorkflowBuilderSection;
