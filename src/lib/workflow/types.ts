export interface NodeProperty {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  defaultValue?: unknown;
}

export interface NodeType {
  type: string;
  label: string;
  properties: NodeProperty[];
}

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, unknown>;
}
