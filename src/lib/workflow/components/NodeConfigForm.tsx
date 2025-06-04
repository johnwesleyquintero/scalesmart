import React from 'react';
import { NodeProperty, NodeType } from '../types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface NodeConfigFormProps {
  nodeType: NodeType;
  onChange: (propertyName: string, value: unknown) => void;
  values: Record<string, unknown>;
}

const NodeConfigForm: React.FC<NodeConfigFormProps> = ({
  nodeType,
  onChange,
  values,
}) => {
  return (
    <div>
      {nodeType.properties.map((property: NodeProperty) => (
        <div key={property.name}>
          <Label htmlFor={property.name}>{property.label}</Label>
          {property.type === 'string' && (
            <Input
              id={property.name}
              type="text"
              aria-label={property.label}
              value={(values[property.name] as string) || ''}
              onChange={(e) => onChange(property.name, e.target.value)}
            />
          )}
          {property.type === 'number' && (
            <Input
              id={property.name}
              type="number"
              aria-label={property.label}
              value={(values[property.name] as number) || 0}
              onChange={(e) =>
                onChange(property.name, parseFloat(e.target.value))
              }
            />
          )}
          {property.type === 'boolean' && (
            <input
              type="checkbox"
              id={property.name}
              aria-label={property.label}
              checked={(values[property.name] as boolean) || false}
              onChange={(e) => onChange(property.name, e.target.checked)}
              className="text-primary focus:ring-primary"
            />
          )}
          {property.type === 'select' && (
            <Select
              value={
                (values[property.name] as string) || property.options?.[0] || ''
              }
              onValueChange={(value) => onChange(property.name, value)}
            >
              <SelectTrigger id={property.name} aria-label={property.label}>
                <SelectValue placeholder={property.label} />
              </SelectTrigger>
              <SelectContent>
                {property.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
};

export default NodeConfigForm;
