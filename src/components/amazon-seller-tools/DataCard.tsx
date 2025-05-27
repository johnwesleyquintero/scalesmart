import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DataCardProps {
  title: string;
  value: string;
  unit?: string;
  description: string;
  colorClass?: string;
  suggestion?: {
    text: string;
    link: string;
  };
}

export default function DataCard({
  title,
  value,
  unit,
  description,
  colorClass,
  suggestion,
}: DataCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {value}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {suggestion && (
          <div className="mt-2">
            <Link href={suggestion.link} passHref>
              <Button variant="link" className="h-auto p-0 text-xs">
                {suggestion.text}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
