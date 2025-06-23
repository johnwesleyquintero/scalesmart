import React from 'react';
import { KpiWidgetConfig } from '../widget-types';

interface KpiWidgetProps {
  config: KpiWidgetConfig;
}

const KpiWidget: React.FC<KpiWidgetProps> = ({ config }) => {
  const { data, title } = config;
  const { value, label, description, trendValue, trendDirection } = data;

  const getTrendIndicator = (direction?: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '▲'; // Up arrow
      case 'down':
        return '▼'; // Down arrow
      case 'neutral':
        return '—'; // Dash
      default:
        return null;
    }
  };

  const trendIndicator = getTrendIndicator(trendDirection);

  return (
    <div className="p-4 border rounded shadow">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
      {(trendValue !== undefined || trendIndicator) && (
        <div
          className={`text-sm mt-2 ${trendDirection === 'up' ? 'text-green-500' : trendDirection === 'down' ? 'text-red-500' : 'text-gray-500'}`}
          data-testid="kpi-trend"
        >
          {trendIndicator && (
            <span data-testid={`trend-icon-${trendDirection}`}>
              {trendIndicator}
            </span>
          )}
          {trendValue !== undefined && (
            <span data-testid="trend-value">{trendValue}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiWidget;
