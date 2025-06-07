import { useCallback, useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { setItem, getItem } from '@/lib/indexeddb-service';

import {
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Node as ReactFlowNode,
  Edge,
  NodeChange,
} from 'reactflow';

import { useToast } from '@/app/hooks/use-toast';
import {
  NodeType,
  NodeProperty,
  Node as CustomNodeType,
} from '@/lib/workflow/types';
import nodeRegistryInstance from '@/lib/workflow/node-registry';
import {
  STORAGE_KEY,
  NODE_LABEL_START,
  NODE_LABEL_LOG,
  NODE_LABEL_END,
  NODE_MESSAGE_HELLO,
  TOAST_TITLE_SAVE_SUCCESS,
  TOAST_DESC_SAVE_SUCCESS,
  TOAST_TITLE_SAVE_FAILED,
  TOAST_DESC_SAVE_FAILED,
  TOAST_TITLE_LOAD_SUCCESS,
  TOAST_DESC_LOAD_SUCCESS,
  TOAST_TITLE_LOAD_FAILED,
  TOAST_DESC_LOAD_FAILED_PARSE,
  TOAST_DESC_LOAD_FAILED_INVALID,
  TOAST_DESC_LOAD_FAILED_UNEXPECTED,
  TOAST_TITLE_NO_WORKFLOW,
  TOAST_DESC_NO_WORKFLOW,
  TOAST_TITLE_EXECUTION_INITIATED,
  TOAST_DESC_EXECUTION_INITIATED,
  TOAST_TITLE_EXECUTION_FAILED,
  TOAST_DESC_EXECUTION_FAILED_ENGINE,
  TOAST_DESC_EXECUTION_FAILED_GENERAL,
  TOAST_VARIANT_SUCCESS,
  TOAST_VARIANT_DESTRUCTIVE,
  TOAST_VARIANT_INFO,
} from '@/lib/workflow/constants';
import { ToastProps } from '@/app/hooks/use-toast'; // Import ToastProps from use-toast hook

// Define a specific object store name for workflow data in IndexedDB
const WORKFLOW_DATA_OBJECT_STORE_NAME = 'workflowDataStore';

/**
 * Creates the initial set of nodes for a new workflow.
 * Defined outside the component to prevent recreation on every render.
 */
const createInitialNodes = (): ReactFlowNode[] => [
  {
    id: uuidv4(),
    type: 'start',
    position: { x: 50, y: 50 },
    data: {
      label:
        nodeRegistryInstance.getNodeType('start')?.label || NODE_LABEL_START,
    },
  },
  {
    id: uuidv4(),
    type: 'log',
    position: { x: 250, y: 50 },
    data: {
      label: nodeRegistryInstance.getNodeType('log')?.label || NODE_LABEL_LOG,
      message:
        nodeRegistryInstance
          .getNodeType('log')
          ?.properties.find((p) => p.name === 'message')?.defaultValue ||
        NODE_MESSAGE_HELLO,
    },
  },
  {
    id: uuidv4(),
    type: 'end',
    position: { x: 450, y: 50 },
    data: {
      label: nodeRegistryInstance.getNodeType('end')?.label || NODE_LABEL_END,
    },
  },
];

/**
 * Creates the initial set of edges connecting the initial nodes.
 * Requires the initial nodes to get their IDs.
 * Defined outside the component to prevent recreation on every render.
 */
const createInitialEdges = (initialNodes: ReactFlowNode[]): Edge[] => {
  // Find nodes by type to ensure correct connections even if array order changes
  const startNode = initialNodes.find((node) => node.type === 'start');
  const logNode = initialNodes.find((node) => node.type === 'log');
  const endNode = initialNodes.find((node) => node.type === 'end');

  const edges: Edge[] = [];

  if (startNode && logNode) {
    edges.push({ id: uuidv4(), source: startNode.id, target: logNode.id });
  }
  if (logNode && endNode) {
    edges.push({ id: uuidv4(), source: logNode.id, target: endNode.id });
  }

  return edges;
};

// --- Type Definitions ---

// Define an interface for the expected structure of loaded workflow data
interface SavedWorkflowData {
  // Although ReactFlow internally uses ReactFlowNode,
  // our custom logic (like nodeRegistry) works with CustomNodeType.
  // We assert/cast when converting between the two representations.
  nodes: (Omit<ReactFlowNode, 'data'> & { data: CustomNodeType['data'] })[];
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
  const validationErrors: string[] = [];

  // Check if nodes and edges properties exist and are arrays
  if (!Array.isArray(potentialData.nodes)) {
    validationErrors.push('nodes property is missing or not an array.');
  }
  if (!Array.isArray(potentialData.edges)) {
    validationErrors.push('edges property is missing or not an array.');
  }

  if (validationErrors.length > 0) {
    console.error(
      'Workflow data validation failed:',
      validationErrors.join(' '),
    );
    return false;
  }

  // Perform deeper checks on array contents for expected essential structure and types
  // Check nodes array for minimal ReactFlowNode structure with CustomNodeType data constraints
  const nodesValid =
    Array.isArray(potentialData.nodes) &&
    potentialData.nodes.every((node) => {
      const nodeValidationErrors: string[] = [];
      // Check if node is an object, not null, and has essential ReactFlowNode properties
      if (
        !(
          typeof node === 'object' &&
          node !== null &&
          'id' in node &&
          typeof node.id === 'string' &&
          'type' in node &&
          typeof node.type === 'string' &&
          'position' in node &&
          typeof node.position === 'object' &&
          node.position !== null &&
          'x' in node.position &&
          typeof node.position.x === 'number' &&
          'y' in node.position &&
          typeof node.position.y === 'number'
        )
      ) {
        nodeValidationErrors.push('Invalid basic node structure found.');
      }

      // Check if node.data exists, is an object, not null
      if (
        !('data' in node) ||
        typeof node.data !== 'object' ||
        node.data === null
      ) {
        nodeValidationErrors.push(
          'Node data property is missing, not an object, or is null.',
        );
      }

      // For simplicity, we'll accept any object data with a string label for now.
      if (!('label' in node.data) || typeof node.data.label !== 'string') {
        nodeValidationErrors.push(
          'Node data is missing "label" property or it is not a string.',
        );
      }

      if (nodeValidationErrors.length > 0) {
        console.error(
          `Validation failed for node ${node?.id || 'unknown'}:`,
          nodeValidationErrors.join(' '),
          node,
        );
        return false;
      }
      return true; // If all checks pass for this node
    });

  if (!nodesValid) {
    return false;
  }

  // Check edges array for minimal Edge structure
  const edgesValid =
    Array.isArray(potentialData.edges) &&
    potentialData.edges.every((edge) => {
      const edgeValidationErrors: string[] = [];
      const isValid =
        typeof edge === 'object' &&
        edge !== null &&
        'id' in edge &&
        typeof edge.id === 'string' && // Edge must have a string id
        'source' in edge &&
        typeof edge.source === 'string' && // Edge must have a string source node id
        'target' in edge &&
        typeof edge.target === 'string'; // Edge must have a string target node id

      if (!isValid) {
        edgeValidationErrors.push('Invalid edge structure found.');
      }

      if (edgeValidationErrors.length > 0) {
        console.error(
          `Validation failed for edge ${edge?.id || 'unknown'}:`,
          edgeValidationErrors.join(' '),
          edge,
        );
        return false;
      }
      return isValid;
    });

  if (!edgesValid) {
    return false;
  }

  return true; // If all checks pass
};

export const useWorkflowBuilderData = () => {
  const { toast } = useToast();

  // Generate initial nodes and edges once when the component mounts
  const initialNodes = useMemo(() => createInitialNodes(), []);
  const initialEdges = useMemo(
    () => createInitialEdges(initialNodes),
    [initialNodes],
  );

  // useNodesState works with ReactFlowNode type, useNodesState's nodes array should be ReactFlowNode
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [registeredNodeTypes, setRegisteredNodeTypes] = useState<NodeType[]>(
    [],
  );

  // State for selected node using our CustomNodeType, and its type definition
  // We store the selected node as CustomNodeType to match how we use its `data`
  const [selectedNode, setSelectedNode] = useState<CustomNodeType | null>(null);
  const [selectedNodeTypeDef, setSelectedNodeTypeDef] =
    useState<NodeType | null>(null);

  // --- Effects ---

  useEffect(() => {
    // Load registered node types from the registry
    if (
      nodeRegistryInstance &&
      typeof nodeRegistryInstance.getNodeTypes === 'function'
    ) {
      try {
        const types = nodeRegistryInstance.getNodeTypes();
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
  }, []); // Empty dependency array means this runs once on mount

  // Update selected node type definition when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      // selectedNode.type is guaranteed to be a string if selectedNode is not null
      // based on the isSavedWorkflowData guard and the way nodes are created/handled.
      setSelectedNodeTypeDef(
        nodeRegistryInstance.getNodeType(selectedNode.type) || null,
      );
    } else {
      setSelectedNodeTypeDef(null);
    }
  }, [selectedNode]); // Re-run when selectedNode changes

  // --- Callbacks and Event Handlers ---

  // Handle connecting nodes
  const onConnect = useCallback(
    (connection: Connection): void => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges], // Dependency: setEdges (stable hook function)
  );

  // Handle dropping a new node onto the canvas
  const onNodeDrop = useCallback(
    (type: string, position: { x: number; y: number }): void => {
      const nodeDef = nodeRegistryInstance.getNodeType(type);
      const nodeLabel = nodeDef?.label || `${type} Node`;
      const initialNodeData: CustomNodeType['data'] = { label: nodeLabel }; // Use CustomNodeType['data'] type

      if (nodeDef && nodeDef.properties) {
        nodeDef.properties.forEach((prop: NodeProperty) => {
          if (prop.defaultValue !== undefined) {
            initialNodeData[prop.name] = prop.defaultValue;
          }
        });
      }

      const newNode: ReactFlowNode = {
        id: uuidv4(),
        type: type,
        position: position,
        data: initialNodeData, // data adheres to CustomNodeType['data']
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes], // Dependency: setNodes (stable hook function)
  );

  // Custom onNodesChange handler to detect selection and update selectedNode state
  const onNodesChangeWithSelection = useCallback(
    (changes: NodeChange[]) => {
      // First, let ReactFlow handle the changes (position, selection, etc.)
      onNodesChange(changes);

      // Then, check if any selection change occurred
      const selectionChange = changes.find(
        (c) => c.type === 'select' && c.selected !== undefined,
      ) as
        | (NodeChange & { type: 'select'; id: string; selected: boolean })
        | undefined; // Explicitly type potential find result

      if (selectionChange) {
        const nodeId = selectionChange.id;
        if (selectionChange.selected) {
          // Find the node in the current nodes state (which is ReactFlowNode[])
          const foundNode = nodes.find((n) => n.id === nodeId);
          // Assert it to CustomNodeType if found and type is a string (basic check)
          // The deeper data structure validation is handled by isSavedWorkflowData on load.
          // Assuming nodes created via onNodeDrop or loaded via loadWorkflow
          // and passed the type guard conform to CustomNodeType['data'] structure.
          if (foundNode && typeof foundNode.type === 'string') {
            setSelectedNode(foundNode as CustomNodeType);
          } else {
            // Should not happen if state is managed correctly, but good defensive practice
            console.warn(
              `Selected node with id ${nodeId} not found or has invalid type in state.`,
            );
            setSelectedNode(null);
          }
        } else {
          // Node was unselected - clear the selected node state
          setSelectedNode(null);
        }
      }
      // Note: If a node is removed while selected, selectedNode should ideally also be cleared.
      // ReactFlow's 'remove' change type could be checked here.
      const removeChange = changes.find(
        (c) => c.type === 'remove' && c.id === selectedNode?.id,
      );
      if (removeChange) {
        setSelectedNode(null);
      }
    },
    [nodes, onNodesChange, selectedNode?.id], // Dependencies: nodes (to access the latest state), onNodesChange (stable hook function), selectedNode?.id (to clear selection if the selected node is removed)
  );

  // Handler for updating node data from NodeConfigForm
  const handleNodeDataChange = useCallback(
    (propertyName: string, value: unknown) => {
      // Ensure a node is selected before attempting to update
      if (!selectedNode) return;

      const updatedNodes = nodes.map((node) => {
        if (node.id === selectedNode.id) {
          // Update the data immutably
          return {
            ...node,
            data: {
              ...node.data,
              [propertyName]: value,
            } as CustomNodeType['data'], // Assert updated data conforms to our type
          };
        }
        return node;
      });

      setNodes(updatedNodes);

      // Also update selectedNode's data for immediate feedback in the form
      // This avoids a re-render cycle waiting for setNodes to update the ReactFlow canvas state first.
      setSelectedNode((prevNode) => {
        if (prevNode && prevNode.id === selectedNode.id) {
          return {
            ...prevNode,
            data: {
              ...prevNode.data,
              [propertyName]: value,
            } as CustomNodeType['data'],
          };
        }
        return prevNode; // Return previous state if somehow the wrong node is selected
      });
    },
    [selectedNode, nodes, setNodes], // Dependencies: selectedNode (to know which node to update), nodes (to map over), setNodes (stable hook function)
  );

  // Save workflow to IndexedDB
  const saveWorkflow = useCallback(async (): Promise<void> => {
    try {
      // Construct the data to save. Nodes are currently ReactFlowNode[].
      // We assert their 'data' property adheres to CustomNodeType['data']
      // based on how nodes are created and loaded.
      const workflow: SavedWorkflowData = {
        nodes: nodes as (Omit<ReactFlowNode, 'data'> & {
          data: CustomNodeType['data'];
        })[], // Assert structure matches SavedWorkflowData nodes array
        edges: edges,
      };
      const stringifiedWorkflow = JSON.stringify(workflow);
      await setItem(
        WORKFLOW_DATA_OBJECT_STORE_NAME,
        STORAGE_KEY,
        stringifiedWorkflow,
      );
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
  }, [nodes, edges, toast]); // Dependencies: nodes, edges (state to save), toast (stable hook function)

  // Load workflow from IndexedDB
  const loadWorkflow = useCallback(async (): Promise<void> => {
    try {
      const workflowData = await getItem(
        `${WORKFLOW_DATA_OBJECT_STORE_NAME}-${STORAGE_KEY}`,
      );

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

        // Use the type guard to validate the structure
        if (isSavedWorkflowData(parsedData)) {
          const loadedData: SavedWorkflowData = parsedData;

          // When setting nodes from loaded data, assert it conforms to ReactFlowNode[]
          // because useNodesState expects ReactFlowNode[].
          // The isSavedWorkflowData guard checked that the data structure is compatible.
          setNodes(loadedData.nodes as ReactFlowNode[]);
          setEdges(loadedData.edges);
          toast({
            title: TOAST_TITLE_LOAD_SUCCESS,
            description: TOAST_DESC_LOAD_SUCCESS,
            variant: TOAST_VARIANT_SUCCESS,
          });
          // Clear selected node state after loading a new workflow
          setSelectedNode(null);
          setSelectedNodeTypeDef(null);
        } else {
          // isSavedWorkflowData logs specific validation errors
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
        description: TOAST_DESC_SAVE_FAILED, // Using save failed desc as a generic failure message
        variant: TOAST_VARIANT_DESTRUCTIVE,
      });
    }
  }, [setNodes, setEdges, toast]); // Dependencies: setNodes, setEdges (stable hook functions), toast

  // Handle workflow execution
  const handleExecuteWorkflow = useCallback(async (): Promise<void> => {
    try {
      // Dynamically import the engine only when needed
      const workflowEngineModule = await import('@/lib/workflow/engine');

      const executeWorkflowFn = workflowEngineModule.executeWorkflow;
      if (typeof executeWorkflowFn === 'function') {
        // Pass nodes typed as CustomNodeType[] for the engine's expectation.
        // We assert here, assuming the nodes state (ReactFlowNode[])
        // contains data structured according to CustomNodeType['data'].
        executeWorkflowFn(
          nodes as CustomNodeType[], // Assert ReactFlowNode[] is compatible with CustomNodeType[] for engine
          edges,
          nodeRegistryInstance,
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
  }, [nodes, edges, toast]); // Dependencies: nodes, edges (workflow structure), toast

  return {
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
  };
};
