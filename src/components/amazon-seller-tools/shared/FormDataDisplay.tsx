'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface FormDataDisplayProps {
  title?: string;
  data: Record<string, any>[];
  onExport?: () => void;
  metrics?: Array<{
    label: string;
    key: string;
    format?: (value: any) => string;
  }>;
}

export default function FormDataDisplay({
  title,
  data,
  onExport,
  metrics,
}: Readonly<FormDataDisplayProps>) {
  if (!data.length) return null;

  return (
    <Card className="p-4 mt-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="bg-muted/20 p-4 rounded-lg">
            {metrics ? (
              <div className="grid grid-cols-2 gap-4">
                {metrics.map(({ label, key, format }) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-medium">
                      {format ? format(item[key]) : item[key]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(item, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      )}
    </Card>
  );
}
