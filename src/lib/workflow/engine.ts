import { Edge, Node as ReactFlowNode } from 'reactflow';
import { Node as CustomNode, NodeType } from './types';
import nodeRegistryInstance from './node-registry'; // Import the NodeRegistry instance and give it a clearer alias

interface NodeData<T = unknown> {
  [key: string]: T;
}

interface NodeHandler<T = unknown> {
  (
    node: CustomNode,
    edges: Edge[],
    allNodes: CustomNode[],
    context: Record<string, unknown>,
    nodeRegistry: typeof nodeRegistryInstance, // Corrected type: use typeof the imported instance
  ): Promise<{ nextNodeId?: string; output?: Record<string, unknown> }>;
}

const resolvePlaceholders = (
  text: string,
  context: Record<string, unknown>,
): string => {
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    return context[key] !== undefined ? String(context[key]) : match;
  });
};

const nodeHandlers: Record<string, NodeHandler> = {
  start: async (node, edges, allNodes, context) => {
    console.log('Start node executed. Initial context:', context);
    const nextEdge = edges.find((edge: Edge) => edge.source === node.id);
    return { nextNodeId: nextEdge?.target, output: { status: 'started' } };
  },
  log: async (node, edges, allNodes, context) => {
    const messageTemplate =
      (node.data.message as string) || 'No message provided.';
    const resolvedMessage = resolvePlaceholders(messageTemplate, context);
    console.log('Log Node Output:', resolvedMessage);
    const nextEdge = edges.find((edge: Edge) => edge.source === node.id);
    return {
      nextNodeId: nextEdge?.target,
      output: { loggedMessage: resolvedMessage },
    };
  },
  end: async (node, edges, allNodes, context) => {
    console.log('End node reached. Final context:', context);
    return { nextNodeId: undefined, output: { status: 'completed' } };
  },
  'email-sender': async (node, edges, allNodes, context) => {
    const recipient = resolvePlaceholders(
      (node.data.recipient as string) || 'no-recipient@example.com',
      context,
    );
    const subject = resolvePlaceholders(
      (node.data.subject as string) || 'No Subject',
      context,
    );
    const body = resolvePlaceholders(
      (node.data.body as string) || 'Empty body.',
      context,
    );

    console.log('--- Email Sender Node ---');
    console.log('Recipient:', recipient);
    console.log('Subject:', subject);
    console.log('Body:', body);
    console.log('--- End Email Sender Node ---');

    const nextEdge = edges.find((edge: Edge) => edge.source === node.id);
    return {
      nextNodeId: nextEdge?.target,
      output: { emailStatus: 'sent', recipient, subject },
    };
  },
  'ai-agent': async (node, edges, allNodes, context) => {
    const aiModel = (node.data.aiModel as string) || 'Default Model';
    const promptTemplate =
      (node.data.prompt as string) || 'Please process this: {{inputData}}';
    const outputVarName = (node.data.outputVar as string) || 'aiOutput';
    const resolvedPrompt = resolvePlaceholders(promptTemplate, context);

    console.log('--- AI Agent Node ---');
    console.log('AI Model:', aiModel);
    console.log('Prompt:', resolvedPrompt);
    console.log('--- End AI Agent Node ---');

    const mockAiResponse = `Mock AI response for: "${resolvedPrompt.substring(0, Math.min(resolvedPrompt.length, 50))}..."`;

    const nextEdge = edges.find((edge: Edge) => edge.source === node.id);
    return {
      nextNodeId: nextEdge?.target,
      output: { [outputVarName]: mockAiResponse },
    };
  },
  'web-poster': async (node, edges, allNodes, context) => {
    const url = resolvePlaceholders(
      (node.data.url as string) || 'https://api.example.com',
      context,
    );
    const method = (node.data.method as string) || 'POST';
    let payload = (node.data.payload as string) || '{}';
    const headers = (node.data.headers as string) || '{}';

    try {
      payload = resolvePlaceholders(payload, context);
      payload = JSON.stringify(JSON.parse(payload));
    } catch (e) {
      console.error('Failed to parse or resolve payload JSON:', e);
      payload = '{}';
    }

    console.log('--- Web Poster Node ---');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Payload:', payload);
    console.log('Headers:', headers);
    console.log('--- End Web Poster Node ---');

    const nextEdge = edges.find((edge: Edge) => edge.source === node.id);
    return {
      nextNodeId: nextEdge?.target,
      output: { webPostStatus: 'posted', url },
    };
  },
};

export async function executeWorkflow(
  nodes: CustomNode[],
  edges: Edge[],
  nodeRegistry: typeof nodeRegistryInstance, // Corrected type here as well
): Promise<void> {
  console.log('Executing workflow...');
  console.log('Nodes:', nodes);
  console.log('Edges:', edges);

  const startNode = nodes.find((node) => node.type === 'start');

  if (!startNode) {
    throw new Error('No start node found in the workflow.');
  }

  let currentNode: CustomNode | undefined = startNode;
  let globalContext: Record<string, unknown> = {};

  while (currentNode) {
    console.log(
      'Executing node:',
      currentNode.id,
      `(Type: ${currentNode.type})`,
    );

    const handler = nodeHandlers[currentNode.type];

    if (!handler) {
      console.warn(
        `No specific handler for node type: ${currentNode.type}. Skipping execution.`,
      );
      const nextEdge = edges.find(
        (edge: Edge) => edge.source === currentNode?.id,
      );
      if (nextEdge) {
        currentNode = nodes.find((node) => node.id === nextEdge.target);
      } else {
        currentNode = undefined;
      }
      continue;
    }

    try {
      const result = await handler(
        currentNode,
        edges,
        nodes,
        globalContext,
        nodeRegistry,
      );
      if (result?.output) {
        globalContext = { ...globalContext, ...result.output };
      }
      currentNode = nodes.find((node) => node.id === result?.nextNodeId);
    } catch (error) {
      const nodeId = currentNode?.id || 'Unknown';
      const nodeType = currentNode?.type || 'Unknown';
      console.error(
        `Error executing node ${nodeId} (Type: ${nodeType}):`,
        error,
      );
      break;
    }
  }

  console.log('Workflow execution finished. Final Context:', globalContext);
}
