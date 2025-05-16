import { Edge, Node } from 'reactflow';

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
    console.warn('No start node found in the workflow.');
    return;
  }

  let currentNode: Node | undefined = startNode;
  let nextNodeId: string | undefined = undefined;
  let message: string;

  while (currentNode) {
    if (!currentNode) {
      break; // Exit the loop if currentNode is undefined
    }

    console.log('Executing node:', currentNode);

    switch (currentNode!.type) {
      case 'start':
        // Start node logic
        console.log('Start node executed.');
        nextNodeId = edges.find(
          (edge) => edge.source === currentNode!.id,
        )?.target;
        break;
      case 'log':
        // Log node logic
        message = currentNode!.data?.message || 'No message provided.';
        console.log('Log:', message);
        nextNodeId = edges.find(
          (edge) => edge.source === currentNode!.id,
        )?.target;
        break;
      case 'end':
        // End node logic
        console.log('End node reached. Workflow complete.');
        nextNodeId = undefined; // Stop the loop
        break;
      default:
        console.warn('Unknown node type:', currentNode!.type);
        nextNodeId = undefined; // Stop the loop
    }

    if (nextNodeId) {
      currentNode = nodes.find((node) => node.id === nextNodeId) as Node;
    } else {
      currentNode = undefined; // End of workflow
    }
  }

  console.log('Workflow execution finished.');
}
