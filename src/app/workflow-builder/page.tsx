'use client';

import DraggableNode from '@/components/ui/DraggableNode';
import WorkflowCanvas from '@/components/ui/WorkflowCanvas';
import nodeRegistry from '@/lib/workflow/node-registry';
import { NodeType } from '@/lib/workflow/types';
import React, { useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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

import styles from './WorkflowBuilderPage.module.css';
const workflowStoreName = 'workflows';

const WorkflowBuilderPage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'start',
      position: { x: 50, y: 50 },
      data: { label: 'Start Node' },
    },
    {
      id: '2',
      type: 'log',
      position: { x: 250, y: 50 },
      data: { label: 'Log Node', message: 'Hello, world!' },
    },
    {
      id: '3',
      type: 'end',
      position: { x: 450, y: 50 },
      data: { label: 'End Node' },
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

  // Register a default node type
  useEffect(() => {
    const defaultNodeType: NodeType = {
      type: 'default',
      label: 'Default Node',
      properties: [
        {
          name: 'name',
          label: 'Name',
          type: 'string',
          defaultValue: 'Default Name',
        },
        { name: 'description', label: 'Description', type: 'string' },
        {
          name: 'enabled',
          label: 'Enabled',
          type: 'boolean',
          defaultValue: true,
        },
      ],
    };
    nodeRegistry.registerNodeType(defaultNodeType);

    // Example: Register other basic node types if they have specific structures
    // or if you want them to appear in a list fetched from the registry.
    // For now, we'll just fetch what's registered.
    // nodeRegistry.registerNodeType({ type: 'start', label: 'Start', properties: [] });
    // nodeRegistry.registerNodeType({ type: 'log', label: 'Log', properties: [{ name: 'message', label: 'Message', type: 'string' }] });
    // nodeRegistry.registerNodeType({ type: 'end', label: 'End', properties: [] });

    // Assuming nodeRegistry has a method to get all registered types
    if (typeof nodeRegistry.getNodeTypes === 'function') {
      setRegisteredNodeTypes(nodeRegistry.getNodeTypes());
    } else {
      // Fallback if getAllNodeTypes doesn't exist, just use the one we registered
      setRegisteredNodeTypes([defaultNodeType]);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1>Workflow Builder</h1>
          <div className={styles.headerButtons}>
            <button onClick={() => saveWorkflow(nodes, edges)}>Save</button>
            <button onClick={loadWorkflow}>Load</button>
          </div>
        </header>
        <div className={styles.contentWrapper}>
          <aside className={styles.sidebar}>
            <h2>Nodes</h2>
            {/* Manually add basic nodes for dragging */}
            <DraggableNode type="start" label="Start Node" />
            <DraggableNode type="log" label="Log Node" />
            <DraggableNode type="end" label="End Node" />
            {/* Add nodes from the registry */}
            {registeredNodeTypes.map((nodeType) => (
              <DraggableNode
                key={nodeType.type}
                type={nodeType.type}
                label={nodeType.label}
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
            />
            <button
              className={styles.executeButton}
              onClick={() => {
                import('@/lib/workflow/engine').then((module) => {
                  module.executeWorkflow(nodes, edges);
                });
              }}
            >
              Execute Workflow
            </button>
          </main>
        </div>
      </div>
    </DndProvider>
  );

  async function saveWorkflow(currentNodes: Node[], currentEdges: Edge[]) {
    try {
      console.time('Save workflow to IndexedDB');
      const workflow = { nodes: currentNodes, edges: currentEdges };
      await setItem(workflowStoreName, 'currentWorkflow', workflow);
      console.timeEnd('Save workflow to IndexedDB');
      // Consider using a toast notification here for better UX
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow to IndexedDB:', error);
      console.log('Workflow saving failed to IndexedDB');
      // Display an error message to the user
      alert('Failed to save workflow. Please check the console for details.');
    }
  }

  async function loadWorkflow() {
    try {
      // Load data from IndexedDB
      console.log('Loading workflow from IndexedDB');
      console.time('Load workflow from IndexedDB');
      const workflow = await getItem(workflowStoreName, 'currentWorkflow');
      if (
        typeof workflow === 'object' &&
        workflow !== null &&
        Array.isArray((workflow as { nodes: Node[] }).nodes) &&
        Array.isArray((workflow as { edges: Edge[] }).edges)
      ) {
        setNodes((workflow as { nodes: Node[] }).nodes);
        setEdges((workflow as { edges: Edge[] }).edges);
        console.log('Workflow loaded successfully from IndexedDB');
        console.timeEnd('Load workflow from IndexedDB');
        // Consider using a toast notification here
        alert('Workflow loaded successfully!');
      } else {
        console.error('Invalid workflow data in IndexedDB:', workflow);
        console.log('Workflow loading failed from IndexedDB');
        alert(
          'Failed to load workflow: Invalid data format. Please check the console for details.',
        );
      }
    } catch (error) {
      console.error('Failed to load workflow from IndexedDB:', error);
      // Display an error message to the user
      alert('Failed to load workflow. Please check the console for details.');
    }
  }
};

export default WorkflowBuilderPage;

// Rollback strategy: To revert to the previous version, simply remove the IndexedDB code
// and the console.time statements.
