import React from 'react';
import { Progress } from '@/components/ui';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { CampaignData } from '@/lib/amazon-tools/metrics';

interface AcosChartProps {
  isLoading: boolean;
  campaigns: CampaignData[];
  selectedMetric: string;
  chartConfig: {
    [key: string]: {
      label: string;
      theme: { light: string; dark: string };
    };
  };
}

const AcosChart: React.FC<AcosChartProps> = ({
  isLoading,
  campaigns,
  selectedMetric,
  chartConfig,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Progress value={undefined} className="w-1/2" />
        <p className="ml-4 text-muted-foreground">Loading chart...</p>
      </div>
    );
  } else if (campaigns.length > 0) {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={campaigns}
          margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="campaign"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ fontSize: '12px', padding: '5px 10px' }}
            formatter={(value: unknown) => {
              if (Array.isArray(value)) {
                const firstValue = value[0];
                if (firstValue === Infinity) return 'Infinity';
                if (typeof firstValue === 'number')
                  return firstValue.toFixed(2);
                return firstValue ?? 'N/A';
              }
              if (value === Infinity) return 'Infinity';
              if (typeof value === 'number') return value.toFixed(2);
              return value ?? 'N/A';
            }}
            labelFormatter={(label: string) => `Campaign: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar
            dataKey={selectedMetric}
            name={chartConfig[selectedMetric].label}
            fill={chartConfig[selectedMetric].theme.light}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  } else {
    return (
      <div className="flex justify-center items-center h-80">
        <p className="text-muted-foreground">No data to display.</p>
      </div>
    );
  }
};

export default AcosChart;
