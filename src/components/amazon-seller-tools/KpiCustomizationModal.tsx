import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast.ts';
import { getItem, setItem } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface KpiCustomizationModalProps {
  defaultMetrics: string[];
  onSave: (selectedMetrics: string[]) => void;
}

const availableMetrics = [
  { value: 'total_sales', label: 'Total Sales' },
  { value: 'ad_spend', label: 'Ad Spend' },
  { value: 'profit', label: 'Profit' },
  { value: 'orders', label: 'Orders' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'units_sold', label: 'Units Sold' },
];

const KpiCustomizationModal: React.FC<KpiCustomizationModalProps> = ({
  defaultMetrics,
  onSave,
}) => {
  const [selectedMetrics, setSelectedMetrics] =
    useState<string[]>(defaultMetrics);
  const { toast } = useToast();

  const handleCheckboxChange = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" aria-label="Customize KPIs">
          <Settings className="w-4 h-4 mr-2" /> Customize KPIs
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Customize Dashboard KPIs</AlertDialogTitle>
          <AlertDialogDescription>
            Select the key performance indicators you want to see on your
            dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          {availableMetrics.map((metric) => (
            <div key={metric.value} className="flex items-center space-x-2">
              <Checkbox
                id={metric.value}
                checked={selectedMetrics.includes(metric.value)}
                onCheckedChange={() => handleCheckboxChange(metric.value)}
              />
              <Label htmlFor={metric.value}>{metric.label}</Label>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onSave(selectedMetrics);
              setItem('cache', 'selectedMetrics', selectedMetrics); // Use 'cache' store
              toast({
                title: 'KPIs Updated',
                description: 'Your dashboard KPIs have been updated.',
              });
            }}
          >
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default KpiCustomizationModal;
