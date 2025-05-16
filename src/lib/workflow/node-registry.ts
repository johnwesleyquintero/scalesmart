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

export default nodeRegistry;
