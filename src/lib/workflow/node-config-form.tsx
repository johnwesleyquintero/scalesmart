import React from 'react';
import { Node as CustomNodeType, NodeType, NodeProperty } from './types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming textarea exists for multiline text
import { Checkbox } from '@/components/ui/checkbox'; // Assuming checkbox exists for boolean
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NodeConfigFormProps {
  node: CustomNodeType;
  nodeTypeDef: NodeType;
  onDataChange: (propertyName: string, value: unknown) => void;
}

export const NodeConfigForm: React.FC<NodeConfigFormProps> = ({
  node,
  nodeTypeDef,
  onDataChange,
}) => {
  if (!nodeTypeDef || !nodeTypeDef.properties) {
    return (
      <p className="text-muted-foreground">
        No configurable properties for this node type.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {nodeTypeDef.properties.map((prop: NodeProperty) => (
        <div key={prop.name} className="flex flex-col space-y-1">
          <Label htmlFor={`node-prop-${prop.name}`}>{prop.label}</Label>
          {prop.type === 'string' && (
            <Input
              id={`node-prop-${prop.name}`}
              type="text"
              value={(node.data[prop.name] as string) || ''}
              onChange={(e) => onDataChange(prop.name, e.target.value)}
            />
          )}
          {prop.type === 'number' && (
            <Input
              id={`node-prop-${prop.name}`}
              type="number"
              value={(node.data[prop.name] as number) || ''}
              onChange={(e) =>
                onDataChange(prop.name, parseFloat(e.target.value))
              }
            />
          )}
          {prop.type === 'boolean' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`node-prop-${prop.name}`}
                checked={(node.data[prop.name] as boolean) || false}
                onCheckedChange={(checked) => onDataChange(prop.name, checked)}
              />
              <Label htmlFor={`node-prop-${prop.name}`}>{prop.label}</Label>
            </div>
          )}
          {prop.type === 'text' && ( // For multiline text
            <Textarea
              id={`node-prop-${prop.name}`}
              value={(node.data[prop.name] as string) || ''}
              onChange={(e) => onDataChange(prop.name, e.target.value)}
              rows={4}
            />
          )}
          {prop.type === 'select' && prop.options && (
            <Select
              value={(node.data[prop.name] as string) || ''}
              onValueChange={(value) => onDataChange(prop.name, value)}
            >
              <SelectTrigger id={`node-prop-${prop.name}`}>
                <SelectValue placeholder={`Select ${prop.label}`} />
              </SelectTrigger>
              <SelectContent>
                {prop.options.map((option) => (
                  <SelectItem key={option} value={option} label={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Add more types as needed (e.g., date, array, object) */}
        </div>
      ))}
    </div>
  );
};
