// src/components/amazon-seller-tools/overview/PlaceholderCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  colorClass?: string;
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  title,
  value,
  unit,
  description,
  colorClass = 'text-gray-600',
}) => (
  <Card className="opacity-75">
    <CardContent className="p-4">
      <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
        {title}
      </h3>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {typeof value === 'number'
          ? value.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })
          : value}
        {unit}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{description}</div>
    </CardContent>
  </Card>
);
