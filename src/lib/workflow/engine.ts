import { Edge, Node } from 'reactflow';

interface NodeData<T = unknown> {
  [key: string]: T;
}

interface NodeHandler<T = unknown> {
  (
    node: Node<NodeData<T>>,
    edges: Edge[],
    nodes: Node[],
  ): Promise<{ nextNodeId?: string } | void>;
}

const nodeRegistry: { [key: string]: NodeHandler } = {
  start: async (node, edges) => {
    console.log('Start node executed.');
    const edgeMap = new Map(edges.map((edge) => [edge.source, edge.target]));
    return { nextNodeId: edgeMap.get(node.id) };
  },
  log: async (node, edges) => {
    console.log('Log:', node.data);
    const nextEdge = edges.find((edge: Edge) => edge.source === node.id);
    return { nextNodeId: nextEdge?.target };
  },
  end: async () => {
    console.log('End node reached. Workflow complete.');
    return { nextNodeId: undefined };
  },
};

export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
): Promise<void> {
  console.log('Executing workflow...');
  console.log('Nodes:', nodes);
  console.log('Edges:', edges);

  // Find the start node
  const startNode = nodes.find((node) => node.type === 'start');

  if (!startNode) {
    throw new Error('No start node found in the workflow.');
  }

  let currentNode: Node<NodeData> | undefined = startNode;
  let nextNodeId: string | undefined = undefined;

  while (currentNode) {
    if (!currentNode) {
      break; // Exit the loop if currentNode is undefined
    }

    console.log('Executing node:', currentNode);

    if (currentNode && currentNode.type) {
      const handler = nodeRegistry[currentNode.type];

      if (!handler) {
        throw new Error(`Unknown node type: ${currentNode.type}`);
      }

      const result = await handler(currentNode, edges, nodes);
      nextNodeId = result?.nextNodeId;
    }

    if (nextNodeId) {
      currentNode = nodes.find(
        (node) => node.id === nextNodeId,
      ) as Node<NodeData>;
    } else {
      currentNode = undefined; // End of workflow
    }
  }

  console.log('Workflow execution finished.');
}
