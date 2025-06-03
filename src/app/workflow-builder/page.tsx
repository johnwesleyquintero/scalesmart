'use client';

import DraggableNode from '@/components/ui/DraggableNode';
import WorkflowCanvas from '@/components/ui/WorkflowCanvas';
import NodeConfigForm from '@/lib/workflow/components/NodeConfigForm';
import nodeRegistry from '@/lib/workflow/node-registry';
import {
  NodeType,
  NodeProperty,
  Node as CustomNodeType,
} from '@/lib/workflow/types'; // Alias Node from our types as CustomNodeType
import React, { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { setItem, getItem } from '@/lib/indexeddb-service';

import {
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Node as ReactFlowNode, // Alias Node from reactflow as ReactFlowNode
  Edge,
  ReactFlowProvider,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { ToastProps } from '@/components/ui/toast';
import { useToast } from '@/app/hooks/use-toast';

import styles from './WorkflowBuilderPage.module.css';

// --- Constants for improved readability and maintainability ---

const STORAGE_KEY = 'currentWorkflow';

// Node Labels (assuming these are defaults or fallback labels)
const NODE_LABEL_START = 'Start Node';
const NODE_LABEL_LOG = 'Log Node';
const NODE_LABEL_END = 'End Node';
const NODE_MESSAGE_HELLO = 'Hello, world!'; // Example default data for log node

// Toast Messages & Titles
const TOAST_TITLE_SAVE_SUCCESS = 'Workflow Saved';
const TOAST_DESC_SAVE_SUCCESS = 'Your workflow has been successfully saved!';
const TOAST_TITLE_SAVE_FAILED = 'Save Failed';
const TOAST_DESC_SAVE_FAILED =
  'Failed to save workflow. Please check the console.';

const TOAST_TITLE_LOAD_SUCCESS = 'Workflow Loaded';
const TOAST_DESC_LOAD_SUCCESS = 'Your workflow has been successfully loaded!';
const TOAST_TITLE_LOAD_FAILED = 'Load Failed';
const TOAST_DESC_LOAD_FAILED_PARSE =
  'Saved workflow data is corrupted. Cannot parse.';
const TOAST_DESC_LOAD_FAILED_INVALID =
  'Loaded data structure is invalid. Please check the console.';
const TOAST_DESC_LOAD_FAILED_UNEXPECTED =
  'Saved data is in an unexpected format.';
const TOAST_TITLE_NO_WORKFLOW = 'No Workflow Found';
const TOAST_DESC_NO_WORKFLOW = 'No saved workflow found in storage.';

const TOAST_TITLE_EXECUTION_INITIATED = 'Execution Initiated';
const TOAST_DESC_EXECUTION_INITIATED = 'Workflow execution started.';
const TOAST_TITLE_EXECUTION_FAILED = 'Execution Failed';
const TOAST_DESC_EXECUTION_FAILED_ENGINE =
  'Workflow engine not properly initialized.';
const TOAST_DESC_EXECUTION_FAILED_GENERAL =
  'Could not execute workflow. Check console for details.';

// Toast Variants (Assuming ShadCN variants)
const TOAST_VARIANT_SUCCESS: ToastProps['variant'] = 'success';
const TOAST_VARIANT_DESTRUCTIVE: ToastProps['variant'] = 'destructive';
const TOAST_VARIANT_INFO: ToastProps['variant'] = 'info';

// --- Type Definitions ---

// Define an interface for the expected structure of loaded workflow data
interface SavedWorkflowData {
  nodes: CustomNodeType[]; // Use CustomNodeType here for internal data
  edges: Edge[];
}

/**
 * Type guard to check if the parsed data conforms to SavedWorkflowData interface
 * with stricter validation on essential node and edge properties.
 * This helps prevent runtime errors when loading potentially malformed data.
 */
const isSavedWorkflowData = (data: unknown): data is SavedWorkflowData => {
  if (typeof data !== 'object' || data === null) {
    console.error('Validation failed: data is not an object or is null.');
    return false;
  }

  const potentialData = data as Partial<SavedWorkflowData>;

  // Check if nodes and edges properties exist and are arrays
  if (!Array.isArray(potentialData.nodes)) {
    console.error(
      'Validation failed: nodes property is missing or not an array.',
    );
    return false;
  }
  if (!Array.isArray(potentialData.edges)) {
    console.error(
      'Validation failed: edges property is missing or not an array.',
    );
    return false;
  }

  // Perform deeper checks on array contents for expected essential structure and types
  const nodesValid = potentialData.nodes.every((node) => {
    const isValid =
      typeof node === 'object' &&
      node !== null &&
      'id' in node &&
      typeof node.id === 'string' && // Node must have a string id
      'type' in node &&
      typeof node.type === 'string' && // Node must have a string type
      'position' in node &&
      typeof node.position === 'object' &&
      node.position !== null && // Node must have a non-null position object
      'x' in node.position &&
      typeof node.position.x === 'number' && // Position must have number x
      'y' in node.position &&
      typeof node.position.y === 'number' && // Position must have number y
      'data' in node &&
      typeof node.data === 'object' &&
      node.data !== null; // Node must have a non-null data object (can add deeper data checks if structure is fixed)

    if (!isValid) {
      console.error('Validation failed: Invalid node structure found.', node);
    }
    return isValid;
  });

  if (!nodesValid) {
    return false; // Detailed error already logged in the every loop
  }

  const edgesValid = potentialData.edges.every((edge) => {
    const isValid =
      typeof edge === 'object' &&
      edge !== null &&
      'id' in edge &&
      typeof edge.id === 'string' && // Edge must have a string id
      'source' in edge &&
      typeof edge.source === 'string' && // Edge must have a string source node id
      'target' in edge &&
      typeof edge.target === 'string'; // Edge must have a string target node id
    // Can add checks for sourceHandle/targetHandle if they are critical

    if (!isValid) {
      console.error('Validation failed: Invalid edge structure found.', edge);
    }
    return isValid;
  });

  if (!edgesValid) {
    return false; // Detailed error already logged in the every loop
  }

  return true; // If all checks pass
};

// --- Workflow Builder Page Component ---

const WorkflowBuilderPage: React.FC = () => {
  const { toast } = useToast();

  // Define initial nodes as ReactFlowNode[] to be compatible with useNodesState
  const initialNodes: ReactFlowNode[] = [
    {
      id: uuidv4(),
      type: 'start',
      position: { x: 50, y: 50 },
      data: {
        label: nodeRegistry.getNodeType('start')?.label || NODE_LABEL_START,
      },
    },
    {
      id: uuidv4(),
      type: 'log',
      position: { x: 250, y: 50 },
      data: {
        label: nodeRegistry.getNodeType('log')?.label || NODE_LABEL_LOG,
        message:
          nodeRegistry
            .getNodeType('log')
            ?.properties.find((p) => p.name === 'message')?.defaultValue ||
          NODE_MESSAGE_HELLO,
      },
    },
    {
      id: uuidv4(),
      type: 'end',
      position: { x: 450, y: 50 },
      data: { label: nodeRegistry.getNodeType('end')?.label || NODE_LABEL_END },
    },
  ];

  // Link initial edges using the IDs generated above
  const initialEdges: Edge[] = [
    { id: uuidv4(), source: initialNodes[0].id, target: initialNodes[1].id },
    { id: uuidv4(), source: initialNodes[1].id, target: initialNodes[2].id },
  ];

  // useNodesState works with ReactFlowNode type, useNodesState's nodes array should be ReactFlowNode
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [registeredNodeTypes, setRegisteredNodeTypes] = useState<NodeType[]>(
    [],
  );

  // State for selected node using our CustomNodeType, and its type definition
  const [selectedNode, setSelectedNode] = useState<CustomNodeType | null>(null);
  const [selectedNodeTypeDef, setSelectedNodeTypeDef] =
    useState<NodeType | null>(null);

  // --- Effects ---

  useEffect(() => {
    if (nodeRegistry && typeof nodeRegistry.getNodeTypes === 'function') {
      try {
        const types = nodeRegistry.getNodeTypes();
        setRegisteredNodeTypes(types);
      } catch (err) {
        console.error('Error fetching node types from registry:', err);
        setRegisteredNodeTypes([]);
      }
    } else {
      console.error(
        'Node registry or getNodeTypes function not available. Cannot load node types for sidebar.',
      );
      setRegisteredNodeTypes([]);
    }
  }, []);

  // Update selected node type definition when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      // Ensure selectedNode.type is defined before passing to getNodeType
      setSelectedNodeTypeDef(
        nodeRegistry.getNodeType(selectedNode.type) || null,
      );
    } else {
      setSelectedNodeTypeDef(null);
    }
  }, [selectedNode]);

  // --- Callbacks and Event Handlers ---

  const onConnect = useCallback(
    (connection: Connection): void => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  const onNodeDrop = useCallback(
    (type: string, position: { x: number; y: number }): void => {
      const nodeDef = nodeRegistry.getNodeType(type);
      const nodeLabel = nodeDef?.label || `${type} Node`;
      const initialNodeData: Record<string, unknown> = { label: nodeLabel };

      if (nodeDef && nodeDef.properties) {
        nodeDef.properties.forEach((prop: NodeProperty) => {
          if (prop.defaultValue !== undefined) {
            initialNodeData[prop.name] = prop.defaultValue;
          }
        });
      }

      const newNode: ReactFlowNode = {
        // Create as ReactFlowNode
        id: uuidv4(),
        type: type,
        position: position,
        data: initialNodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  // Custom onNodesChange handler to detect selection
  const onNodesChangeWithSelection = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      const selectionChange = changes.find(
        (c) => c.type === 'select' && c.selected !== undefined,
      ) as NodeChange & { type: 'select'; id: string; selected: boolean };

      if (selectionChange) {
        const nodeId = selectionChange.id;
        if (selectionChange.selected) {
          // Find the node in the current nodes state and cast it to CustomNodeType
          const foundNode = nodes.find((node) => node.id === nodeId);
          if (foundNode && typeof foundNode.type === 'string') {
            // Ensure type is string
            setSelectedNode(foundNode as CustomNodeType);
          } else {
            setSelectedNode(null);
          }
        } else {
          setSelectedNode(null); // Node was unselected
        }
      }
    },
    [nodes, onNodesChange],
  );

  // Handler for updating node data from NodeConfigForm
  const handleNodeDataChange = useCallback(
    (propertyName: string, value: unknown) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode?.id) {
            return {
              ...node,
              data: {
                ...node.data,
                [propertyName]: value,
              },
            };
          }
          return node;
        }),
      );
      // Also update selectedNode's data for immediate feedback in the form
      setSelectedNode((prevNode) => {
        if (prevNode) {
          return {
            ...prevNode,
            data: {
              ...prevNode.data,
              [propertyName]: value,
            },
          };
        }
        return null;
      });
    },
    [selectedNode, setNodes],
  );

  const saveWorkflow = useCallback(async (): Promise<void> => {
    try {
      // Cast nodes to CustomNodeType[] for saving
      const workflow: SavedWorkflowData = {
        nodes: nodes as CustomNodeType[],
        edges: edges,
      };
      const stringifiedWorkflow = JSON.stringify(workflow);
      await setItem(STORAGE_KEY, stringifiedWorkflow);
      toast({
        title: TOAST_TITLE_SAVE_SUCCESS,
        description: TOAST_DESC_SAVE_SUCCESS,
        variant: TOAST_VARIANT_SUCCESS,
      });
    } catch (error) {
      console.error('Failed to save workflow to IndexedDB:', error);
      toast({
        title: TOAST_TITLE_SAVE_FAILED,
        description: TOAST_DESC_SAVE_FAILED,
        variant: TOAST_VARIANT_DESTRUCTIVE,
      });
    }
  }, [nodes, edges, toast]);

  const loadWorkflow = useCallback(async (): Promise<void> => {
    try {
      const workflowData = await getItem(STORAGE_KEY);

      if (typeof workflowData === 'string' && workflowData.length > 0) {
        let parsedData: unknown;
        try {
          parsedData = JSON.parse(workflowData);
        } catch (parseError) {
          console.error(
            'Failed to parse workflow data from IndexedDB:',
            parseError,
          );
          toast({
            title: TOAST_TITLE_LOAD_FAILED,
            description: TOAST_DESC_LOAD_FAILED_PARSE,
            variant: TOAST_VARIANT_DESTRUCTIVE,
          });
          return;
        }

        if (isSavedWorkflowData(parsedData)) {
          const loadedData: SavedWorkflowData = parsedData;

          // When setting nodes from loaded data, convert CustomNodeType[] to ReactFlowNode[]
          setNodes(loadedData.nodes as ReactFlowNode[]);
          setEdges(loadedData.edges);
          toast({
            title: TOAST_TITLE_LOAD_SUCCESS,
            description: TOAST_DESC_LOAD_SUCCESS,
            variant: TOAST_VARIANT_SUCCESS,
          });
          setSelectedNode(null);
          setSelectedNodeTypeDef(null);
        } else {
          toast({
            title: TOAST_TITLE_LOAD_FAILED,
            description: TOAST_DESC_LOAD_FAILED_INVALID,
            variant: TOAST_VARIANT_DESTRUCTIVE,
          });
        }
      } else if (workflowData === null) {
        toast({
          title: TOAST_TITLE_NO_WORKFLOW,
          description: TOAST_DESC_NO_WORKFLOW,
          variant: TOAST_VARIANT_INFO,
        });
      } else {
        console.error(
          'Unexpected data format or type found in IndexedDB for workflow:',
          typeof workflowData,
          workflowData,
        );
        toast({
          title: TOAST_TITLE_LOAD_FAILED,
          description: TOAST_DESC_LOAD_FAILED_UNEXPECTED,
          variant: TOAST_VARIANT_DESTRUCTIVE,
        });
      }
    } catch (error) {
      console.error('Failed to load workflow from IndexedDB:', error);
      toast({
        title: TOAST_TITLE_LOAD_FAILED,
        description: TOAST_DESC_SAVE_FAILED,
        variant: TOAST_VARIANT_DESTRUCTIVE,
      });
    }
  }, [setNodes, setEdges, toast]);

  const handleExecuteWorkflow = useCallback(async (): Promise<void> => {
    try {
      const workflowEngineModule = await import('@/lib/workflow/engine');

      if (typeof workflowEngineModule.executeWorkflow === 'function') {
        // Pass nodes typed as CustomNodeType for the engine's expectation
        workflowEngineModule.executeWorkflow(
          nodes as CustomNodeType[],
          edges,
          nodeRegistry,
        );
        toast({
          title: TOAST_TITLE_EXECUTION_INITIATED,
          description: TOAST_DESC_EXECUTION_INITIATED,
          variant: TOAST_VARIANT_INFO,
        });
      } else {
        console.error(
          'Workflow execution function not found or module structure is unexpected.',
        );
        toast({
          title: TOAST_TITLE_EXECUTION_FAILED,
          description: TOAST_DESC_EXECUTION_FAILED_ENGINE,
          variant: TOAST_VARIANT_DESTRUCTIVE,
        });
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast({
        title: TOAST_TITLE_EXECUTION_FAILED,
        description: TOAST_DESC_EXECUTION_FAILED_GENERAL,
        variant: TOAST_VARIANT_DESTRUCTIVE,
      });
    }
  }, [nodes, edges, toast]);

  // --- Render ---

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
            {/* Display configuration form if a node is selected and has properties */}
            {selectedNode &&
              selectedNodeTypeDef &&
              selectedNodeTypeDef.properties.length > 0 && (
                <div className={styles.configPanel}>
                  <h3>
                    Configure{' '}
                    {(selectedNode.data.label as string) || selectedNode.type}{' '}
                    Node
                  </h3>
                  <NodeConfigForm
                    nodeType={selectedNodeTypeDef}
                    values={selectedNode.data}
                    onChange={handleNodeDataChange}
                  />
                </div>
              )}
          </aside>
          <main className={styles.mainContent}>
            <WorkflowCanvas
              nodes={nodes as CustomNodeType[]} // Pass nodes typed as CustomNodeType for WorkflowCanvas prop type
              edges={edges}
              onNodesChange={onNodesChangeWithSelection}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDrop={onNodeDrop}
              onNodeClick={(_event, node) =>
                setSelectedNode(node as CustomNodeType)
              } // Cast to CustomNodeType
              onPaneClick={() => setSelectedNode(null)}
            />
          </main>
        </div>
        <Toaster />
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderPage;
