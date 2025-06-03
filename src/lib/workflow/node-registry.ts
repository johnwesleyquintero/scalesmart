import { NodeType } from './types';

class NodeRegistry {
  private nodeTypes: Record<string, NodeType> = {};

  registerNodeType(nodeType: NodeType) {
    this.nodeTypes[nodeType.type] = nodeType;
  }

  getNodeType(type: string): NodeType | undefined {
    return this.nodeTypes[type];
  }

  getNodeTypes(): NodeType[] {
    return Object.values(this.nodeTypes);
  }
}

const nodeRegistry = new NodeRegistry();

// Registering standard nodes that exist
nodeRegistry.registerNodeType({
  type: 'start',
  label: 'Start Workflow',
  properties: [], // Start node typically doesn't need properties
});

nodeRegistry.registerNodeType({
  type: 'end',
  label: 'End Workflow',
  properties: [], // End node typically doesn't need properties
});

nodeRegistry.registerNodeType({
  type: 'log',
  label: 'Log Message',
  properties: [
    {
      name: 'message',
      label: 'Message to Log',
      type: 'string',
      defaultValue: 'Hello, world!',
    },
  ],
});

// Registering new custom node types for the user's example
nodeRegistry.registerNodeType({
  type: 'email-sender',
  label: 'Send Email',
  properties: [
    { name: 'recipient', label: 'To Email', type: 'string', defaultValue: '' },
    { name: 'subject', label: 'Subject', type: 'string', defaultValue: '' },
    {
      name: 'body',
      label: 'Body (supports placeholders like {{inputData}})',
      type: 'string',
      defaultValue: 'Email content here.',
    },
  ],
});

nodeRegistry.registerNodeType({
  type: 'ai-agent',
  label: 'AI Agent Call',
  properties: [
    {
      name: 'aiModel',
      label: 'AI Model',
      type: 'select',
      options: ['Gemini', 'GPT-4', 'Claude'],
      defaultValue: 'Gemini',
    },
    {
      name: 'prompt',
      label: 'AI Prompt (supports placeholders)',
      type: 'string',
      defaultValue: 'Summarize the following text: {{inputData}}',
    },
    {
      name: 'outputVar',
      label: 'Output Variable Name',
      type: 'string',
      defaultValue: 'aiResult',
    },
  ],
});

nodeRegistry.registerNodeType({
  type: 'web-poster',
  label: 'Make Web Request',
  properties: [
    {
      name: 'url',
      label: 'Target URL',
      type: 'string',
      defaultValue: 'https://api.example.com/post',
    },
    {
      name: 'method',
      label: 'HTTP Method',
      type: 'select',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      defaultValue: 'POST',
    },
    {
      name: 'payload',
      label: 'Payload (JSON string, supports placeholders)',
      type: 'string',
      defaultValue: '{ "data": "{{inputData}}" }',
    },
    {
      name: 'headers',
      label: 'Headers (JSON string)',
      type: 'string',
      defaultValue: '{ "Content-Type": "application/json" }',
    },
  ],
});

export default nodeRegistry;
