'use client';

import DraggableNode from '@/components/ui/DraggableNode';
import WorkflowCanvas from '@/components/ui/WorkflowCanvas';
import NodeConfigForm from '@/lib/workflow/components/NodeConfigForm';
import nodeRegistry from '@/lib/workflow/node-registry';
import {
  NodeType,
  NodeProperty,
  Node as CustomNodeType,
} from '@/lib/workflow/types';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { setItem, getItem } from '@/lib/indexeddb-service';

import {
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Node as ReactFlowNode,
  Edge,
  ReactFlowProvider,
  NodeChange,
} from 'reactflow';
import { useSensors, useSensor } from '@dnd-kit/core';
import { PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/app/hooks/use-toast';

import styles from './WorkflowBuilderPage.module.css';
import { useWorkflowBuilderData } from '@/hooks/use-workflow-builder-data';

const WorkflowBuilderPage: React.FC = () => {
  const { toast } = useToast();

  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    registeredNodeTypes,
    setRegisteredNodeTypes,
    initialNodes,
    initialEdges,
    onConnect,
    onNodeDrop,
    onNodesChangeWithSelection,
    handleNodeDataChange,
    saveWorkflow,
    loadWorkflow,
    handleExecuteWorkflow,
    selectedNode,
    setSelectedNode,
    selectedNodeTypeDef,
    setSelectedNodeTypeDef,
  } = useWorkflowBuilderData();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  return (
    <ReactFlowProvider>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1>Workflow Builder</h1>
          <div className={styles.headerButtons}>
            <Button onClick={saveWorkflow}>Save</Button>
            <Button onClick={loadWorkflow}>Load</Button>
            <Button onClick={handleExecuteWorkflow}>Execute Workflow</Button>
          </div>
        </header>
        <div className={styles.contentWrapper}>
          <aside className={styles.sidebar}>
            <h2>Nodes</h2>
            {registeredNodeTypes.length > 0 ? (
              registeredNodeTypes.map((nodeType) => (
                <DraggableNode
                  key={nodeType.type}
                  label={nodeType.label}
                  type={nodeType.type}
                />
              ))
            ) : (
              <p>Loading nodes or none available...</p>
            )}
            {/* Display configuration form if a node is selected and has configurable properties */}
            {selectedNode &&
              selectedNodeTypeDef &&
              selectedNodeTypeDef.properties.length > 0 && (
                <div className={styles.configPanel}>
                  <h3>
                    Configure{' '}
                    {(selectedNode.data.label as string) || selectedNode.type}{' '}
                    Node
                  </h3>
                  {/* Pass selectedNodeTypeDef and selectedNode.data */}
                  <NodeConfigForm
                    nodeType={selectedNodeTypeDef as NodeType}
                    values={selectedNode.data} // Pass the data object
                    onChange={handleNodeDataChange}
                  />
                </div>
              )}
          </aside>
          <main className={styles.mainContent}>
            <WorkflowCanvas
              nodes={nodes as CustomNodeType[]} // Assert ReactFlowNode[] is compatible with WorkflowCanvas's expected CustomNodeType[] prop
              edges={edges}
              onNodesChange={onNodesChangeWithSelection} // Use custom handler
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDrop={onNodeDrop}
              // When a node is clicked, find it in the current state and set it as selectedNode
              onNodeClick={useCallback(
                (_event, node: ReactFlowNode) => {
                  // Find the node in the current nodes state to ensure we have the latest data
                  const foundNode = nodes.find(
                    (n: ReactFlowNode) => n.id === node.id,
                  );
                  if (foundNode && typeof foundNode.type === 'string') {
                    setSelectedNode(foundNode as CustomNodeType); // Assert it to CustomNodeType
                  } else {
                    // Should not happen if ReactFlow is providing a valid node click event,
                    // but defensive check.
                    console.warn(
                      `Clicked node with id ${node.id} not found or has invalid type in state.`,
                    );
                    setSelectedNode(null);
                  }
                },
                [nodes, setSelectedNode],
              )} // Dependency on nodes state and setSelectedNode setter
              onPaneClick={useCallback(
                () => setSelectedNode(null),
                [setSelectedNode],
              )} // Dependency on setSelectedNode setter
            />
          </main>
        </div>
        <Toaster />
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderPage;
