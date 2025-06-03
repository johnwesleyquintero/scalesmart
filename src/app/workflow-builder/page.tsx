'use client';

import DraggableNode from '@/components/ui/DraggableNode';
import WorkflowCanvas from '@/components/ui/WorkflowCanvas';
import nodeRegistry from '@/lib/workflow/node-registry';
import { NodeType } from '@/lib/workflow/types';
import React, { useCallback, useEffect, useState } from 'react';
// Remove DndContext, useSensors, useSensor, MouseSensor, TouchSensor as they are no longer directly used here for canvas drops
// import { DndContext, useSensors, useSensor, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { setItem, getItem } from '@/lib/indexeddb-service';
import {
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/app/hooks/use-toast.tsx';

import styles from './WorkflowBuilderPage.module.css';

// Define constants for node labels and messages to avoid duplication
const NODE_LABEL_START = 'Start Node';
const NODE_LABEL_LOG = 'Log Node';
const NODE_LABEL_END = 'End Node';
const NODE_LABEL_DEFAULT = 'Default Node';
const NODE_MESSAGE_HELLO = 'Hello, world!';

const WorkflowBuilderPage = () => {
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'start',
      position: { x: 50, y: 50 },
      data: { label: NODE_LABEL_START },
    },
    {
      id: '2',
      type: 'log',
      position: { x: 250, y: 50 },
      data: { label: NODE_LABEL_LOG, message: NODE_MESSAGE_HELLO },
    },
    {
      id: '3',
      type: 'end',
      position: { x: 450, y: 50 },
      data: { label: NODE_LABEL_END },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  const [registeredNodeTypes, setRegisteredNodeTypes] = useState<NodeType[]>(
    [],
  );

  useEffect(() => {
    nodeRegistry.registerNodeType({
      type: 'start',
      label: NODE_LABEL_START,
      properties: [],
    });
    nodeRegistry.registerNodeType({
      type: 'log',
      label: NODE_LABEL_LOG,
      properties: [
        { name: 'message', label: 'Message', type: 'string', defaultValue: '' },
      ],
    });
    nodeRegistry.registerNodeType({
      type: 'end',
      label: NODE_LABEL_END,
      properties: [],
    });
    nodeRegistry.registerNodeType({
      type: 'default',
      label: NODE_LABEL_DEFAULT,
      properties: [
        {
          name: 'name',
          label: 'Name',
          type: 'string',
          defaultValue: 'Default Name',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'string',
          defaultValue: '',
        },
        {
          name: 'enabled',
          label: 'Enabled',
          type: 'boolean',
          defaultValue: true,
        },
      ],
    });

    if (typeof nodeRegistry.getNodeTypes === 'function') {
      setRegisteredNodeTypes(nodeRegistry.getNodeTypes());
    } else {
      console.warn(
        'nodeRegistry.getNodeTypes is not a function. Fallback to basic nodes.',
      );
      setRegisteredNodeTypes([
        { type: 'start', label: NODE_LABEL_START, properties: [] },
        {
          type: 'log',
          label: NODE_LABEL_LOG,
          properties: [{ name: 'message', label: 'Message', type: 'string' }],
        },
        { type: 'end', label: NODE_LABEL_END, properties: [] },
        { type: 'default', label: NODE_LABEL_DEFAULT, properties: [] },
      ]);
    }
  }, []);

  const onNodeDrop = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: String(Math.random()),
        type: type,
        position: position,
        data: { label: `${type} Node` },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  async function saveWorkflow(currentNodes: Node[], currentEdges: Edge[]) {
    console.log('Saving workflow:', {
      nodes: currentNodes,
      edges: currentEdges,
    });
    try {
      console.time('Save workflow to IndexedDB');
      const workflow = { nodes: currentNodes, edges: currentEdges };
      const stringifiedWorkflow = JSON.stringify(workflow);
      await setItem('currentWorkflow', stringifiedWorkflow);
      console.timeEnd('Save workflow to IndexedDB');
      toast({
        title: 'Workflow Saved',
        description: 'Your workflow has been successfully saved!',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to save workflow to IndexedDB:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save workflow. Please check the console.',
        variant: 'destructive',
      });
    }
  }

  async function loadWorkflow() {
    try {
      console.time('Load workflow from IndexedDB');
      const workflow = await getItem('currentWorkflow');
      if (typeof workflow === 'string' && workflow !== null) {
        const parsedWorkflow = JSON.parse(workflow);
        if (
          Array.isArray((parsedWorkflow as { nodes: Node[] }).nodes) &&
          Array.isArray((parsedWorkflow as { edges: Edge[] }).edges)
        ) {
          setNodes((parsedWorkflow as { nodes: Node[] }).nodes);
          setEdges((parsedWorkflow as { edges: Edge[] }).edges);
          console.timeEnd('Load workflow from IndexedDB');
          toast({
            title: 'Workflow Loaded',
            description: 'Your workflow has been successfully loaded!',
            variant: 'success',
          });
        } else {
          console.error('Invalid workflow data in IndexedDB:', workflow);
          toast({
            title: 'Load Failed',
            description: 'Invalid workflow data. Please check the console.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'No Workflow Found',
          description: 'No saved workflow found in storage.',
          variant: 'info',
        });
      }
    } catch (error) {
      console.error('Failed to load workflow from IndexedDB:', error);
      toast({
        title: 'Load Failed',
        description: 'Failed to load workflow. Please check the console.',
        variant: 'destructive',
      });
    }
  }

  return (
    // Removed DndContext wrapping
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Workflow Builder</h1>
        <div className={styles.headerButtons}>
          <Button onClick={() => saveWorkflow(nodes, edges)}>Save</Button>
          <Button onClick={loadWorkflow}>Load</Button>
        </div>
      </header>
      <div className={styles.contentWrapper}>
        <aside className={styles.sidebar}>
          <h2>Nodes</h2>
          {registeredNodeTypes.map((nodeType) => (
            <DraggableNode
              key={nodeType.type}
              label={nodeType.label}
              type={nodeType.type}
            />
          ))}
        </aside>
        <main className={styles.mainContent}>
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDrop={onNodeDrop}
          />
          <Button
            onClick={() => {
              import('@/lib/workflow/engine').then((module) => {
                module.executeWorkflow(nodes, edges);
              });
            }}
          >
            Execute Workflow
          </Button>
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default WorkflowBuilderPage;
