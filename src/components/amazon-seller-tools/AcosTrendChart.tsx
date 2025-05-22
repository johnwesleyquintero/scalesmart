import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  registerables,
  TooltipItem,
  ChartConfiguration,
} from 'chart.js';
import { CampaignData } from '@/lib/amazon-tools/metrics';

Chart.register(...registerables);

interface AcosTrendChartProps {
  data: CampaignData[];
  metrics: (keyof CampaignData)[];
  availableMetrics: (keyof CampaignData)[];
}

const AcosTrendChart: React.FC<AcosTrendChartProps> = ({
  data,
  metrics,
  availableMetrics,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [selectedMetrics, setSelectedMetrics] =
    useState<(keyof CampaignData)[]>(metrics);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map((item) => item.date),
            datasets: selectedMetrics.map((metric) => ({
              label: metric,
              data: data.map((item) => item[metric] as number), // Random color for each metric
              borderColor:
                '#' + Math.floor(Math.random() * 16777215).toString(16),
              borderWidth: 2,
              fill: false,
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              legend: {
                display: true,
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
              callbacks: {
                label: (context: TooltipItem<'line'>) => {
                  let label = context.dataset.label ?? '';

                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD', // Assuming USD based on other components
                    }).format(context.parsed.y as number);
                  }
                  return label;
                },
              },
            },
          },
        } as ChartConfiguration);
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, selectedMetrics]);

  const handleMetricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const metric = e.target.value as keyof CampaignData;
    if (e.target.checked) {
      setSelectedMetrics([...selectedMetrics, metric]);
    } else {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    }
  };

  return (
    <div>
      {availableMetrics.map((metric) => (
        <div key={metric.toString()}>
          <input
            type="checkbox"
            id={metric.toString()}
            value={metric.toString()}
            checked={selectedMetrics.includes(metric)}
            onChange={handleMetricChange}
          />
          <label htmlFor={metric.toString()}>{metric.toString()}</label>
        </div>
      ))}

      <canvas ref={chartRef} style={{ width: '100%', height: '300px' }} />
    </div>
  );
};

export default AcosTrendChart;
