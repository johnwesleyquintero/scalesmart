import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Chart,
  registerables,
  TooltipItem,
  ChartConfiguration,
} from 'chart.js';
import { CampaignData } from '@/lib/amazon-tools/metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

Chart.register(...registerables);

/**
 * Props interface for the AcosTrendChart component.
 * @property {CampaignData[]} data - The campaign data to display in the chart.
 * @property {(keyof CampaignData)[]} availableMetrics - A list of available metrics to choose from for display.
 */
interface AcosTrendChartProps {
  data: CampaignData[];
  availableMetrics: (keyof CampaignData)[];
}

/**
 * `AcosTrendChart` displays a trend chart for selected ACoS-related metrics over time.
 * Users can select which metrics to visualize using checkboxes.
 *
 * @param {AcosTrendChartProps} props - The props for the component.
 * @param {CampaignData[]} props.data - The campaign data.
 * @param {(keyof CampaignData)[]} props.availableMetrics - Metrics available for selection.
 * @returns {JSX.Element} A card containing the metric selection checkboxes and the trend chart.
 */
export const AcosTrendChart: React.FC<AcosTrendChartProps> = ({
  data,
  availableMetrics,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  // Initialize selectedMetrics with a default set if availableMetrics is not empty,
  // or an empty array if no metrics are available.
  const [selectedMetrics, setSelectedMetrics] = useState<
    (keyof CampaignData)[]
  >(availableMetrics.length > 0 ? [availableMetrics[0]] : []);

  // Effect to destroy and re-create the chart when data or selected metrics change.
  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart instance to prevent memory leaks and re-render issues
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Filter out metrics that are not numbers or are undefined/null
        const numericDataMetrics = selectedMetrics.filter((metricKey) =>
          data.every(
            (item) =>
              typeof item[metricKey] === 'number' &&
              item[metricKey] !== null &&
              item[metricKey] !== undefined,
          ),
        );

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map((item) => item.date), // Assuming 'date' is a string or can be formatted
            datasets: numericDataMetrics.map((metric) => ({
              label: String(metric), // Ensure label is a string
              data: data.map((item) => item[metric] as number),
              borderColor:
                '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
              borderWidth: 2,
              fill: false,
              tension: 0.1, // Smooth the lines
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Value', // Generic Y-axis label
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Date', // X-axis label
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context: TooltipItem<'line'>) => {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      // Format as a number, consider adding currency/percentage based on metric
                      label += new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(context.parsed.y);
                    }
                    return label;
                  },
                },
              },
            },
          },
        } as ChartConfiguration); // Type assertion for ChartConfiguration
      }
    }

    // Cleanup function to destroy the chart instance when the component unmounts
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, selectedMetrics]); // Re-run effect if data or selectedMetrics change

  /**
   * Handles the change event for metric checkboxes.
   * Adds or removes the selected metric from the `selectedMetrics` state.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
  const handleMetricChange = useCallback(
    (checked: boolean, metric: keyof CampaignData) => {
      setSelectedMetrics((prev) =>
        checked ? [...prev, metric] : prev.filter((m) => m !== metric),
      );
    },
    [],
  );

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle>ACoS Trend Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          {availableMetrics.map((metric) => (
            <div key={String(metric)} className="flex items-center space-x-2">
              <Checkbox
                id={`metric-${String(metric)}`}
                checked={selectedMetrics.includes(metric)}
                onCheckedChange={(checked) =>
                  handleMetricChange(Boolean(checked), metric)
                }
              />
              <Label htmlFor={`metric-${String(metric)}`}>
                {String(metric)
                  .replace(/([A-Z])/g, ' $1')
                  .trim()}
              </Label>
            </div>
          ))}
        </div>
        <div className="relative h-[300px] w-full">
          {data.length > 0 && selectedMetrics.length > 0 ? (
            <canvas ref={chartRef} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {data.length === 0
                ? 'No campaign data available to display trend.'
                : 'Please select at least one metric to display.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
