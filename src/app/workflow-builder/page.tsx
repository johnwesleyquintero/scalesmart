'use client';

import DraggableNode from '@/components/ui/DraggableNode';
import WorkflowCanvas from '@/components/ui/WorkflowCanvas';
import nodeRegistry from '@/lib/workflow/node-registry';
import { NodeType } from '@/lib/workflow/types';
import React, { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { addEdge, useEdgesState, useNodesState } from 'reactflow';
import { Connection } from 'reactflow';
import 'reactflow/dist/style.css';

const borderColor = '1px solid #ccc';

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

  // Register a default node type
  React.useEffect(() => {
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
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <aside style={{ width: '200px', borderRight: borderColor }}>
          <h2>Nodes</h2>
          <DraggableNode type="default" label="Default Node" />
        </aside>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ height: '50px', borderBottom: borderColor }}>
            <h1>Workflow Builder</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => saveWorkflow(nodes, edges)}>Save</button>
              <button onClick={loadWorkflow}>Load</button>
            </div>
          </header>
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
          <button
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
    </DndProvider>
  );

  function saveWorkflow(
    nodes: import('reactflow').Node[],
    edges: import('reactflow').Edge[],
  ) {
    try {
      const workflow = { nodes, edges };
      localStorage.setItem('workflow', JSON.stringify(workflow));
    } catch (error) {
      console.error('Failed to save workflow to local storage:', error);
      // Display an error message to the user
      alert('Failed to save workflow. Please check the console for details.');
    }
  }

  function loadWorkflow() {
    const workflowString = localStorage.getItem('workflow');
    if (workflowString) {
      try {
        const workflow = JSON.parse(workflowString);
        if (
          typeof workflow === 'object' &&
          workflow !== null &&
          Array.isArray(workflow.nodes) &&
          Array.isArray(workflow.edges)
        ) {
          setNodes(workflow.nodes);
          setEdges(workflow.edges);
        } else {
          console.error('Invalid workflow data in local storage:', workflow);
          alert(
            'Failed to load workflow: Invalid data format. Please check the console for details.',
          );
        }
      } catch (error) {
        console.error('Failed to load workflow from local storage:', error);
        // Display an error message to the user
        alert('Failed to load workflow. Please check the console for details.');
      }
    }
  }
};

export default WorkflowBuilderPage;
