export interface NodeProperty {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  defaultValue?: any;
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
  data: Record<string, any>;
}
