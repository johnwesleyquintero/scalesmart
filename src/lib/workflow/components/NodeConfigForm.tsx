import React from 'react';
import { NodeProperty, NodeType } from '../types';

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
          <label htmlFor={property.name} className="text-foreground">{property.label}</label>
          {property.type === 'string' && (
            <input
              type="text"
              id={property.name}
              value={(values[property.name] as string) || ''}
              onChange={(e) => onChange(property.name, e.target.value)}
              className="w-full p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
            />
          )}
          {property.type === 'number' && (
            <input
              type="number"
              id={property.name}
              value={(values[property.name] as number) || 0}
              onChange={(e) =>
                onChange(property.name, parseFloat(e.target.value))
              }
              className="w-full p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
            />
          )}
          {property.type === 'boolean' && (
            <input
              type="checkbox"
              id={property.name}
              checked={(values[property.name] as boolean) || false}
              onChange={(e) => onChange(property.name, e.target.checked)}
              className="text-primary focus:ring-primary"
            />
          )}
          {property.type === 'select' && (
            <select
              id={property.name}
              value={
                (values[property.name] as string) || property.options?.[0] || ''
              }
              onChange={(e) => onChange(property.name, e.target.value)}
              className="w-full p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
            >
              {property.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
};

export default NodeConfigForm;
