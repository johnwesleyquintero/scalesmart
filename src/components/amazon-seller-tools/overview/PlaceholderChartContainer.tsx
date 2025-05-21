// src/components/amazon-seller-tools/overview/PlaceholderChartContainer.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderChartContainerProps {
  title: string;
  children: React.ReactNode;
  suffixText?: string; // Make suffixText optional or provide a default
}

export const PlaceholderChartContainer: React.FC<
  PlaceholderChartContainerProps
> = ({
  title,
  children,
  suffixText = '(Sample Data)', // Default suffix text
}) => (
  <Card className="opacity-75">
    <CardContent className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
        {title} <span className="text-sm font-normal">{suffixText}</span>
      </h3>
      {children}
    </CardContent>
  </Card>
);
