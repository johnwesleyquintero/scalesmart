// src/components/amazon-seller-tools/overview/ComparisonKpiCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

const DEFAULT_CHANGE_TEXT = 'vs prev. period';
const POSITIVE_INFINITY_CHANGE_TEXT = '+∞% vs prev. period';
const NEGATIVE_INFINITY_CHANGE_TEXT = '-∞% vs prev. period';

const calculatePercentageChange = (
  current?: number,
  previous?: number,
): number | null => {
  if (typeof current !== 'number' || typeof previous !== 'number') {
    return null;
  }
  if (previous !== 0) {
    return ((current - previous) / Math.abs(previous)) * 100;
  }
  if (current !== 0) {
    return current > 0 ? Infinity : -Infinity;
  }
  return 0; // Both are 0
};

interface ChangeDisplayProps {
  text: string;
  color: string;
  Icon: React.ElementType;
}

const getChangeDisplayProperties = (
  percentageChange: number | null,
  higherIsBetter: boolean,
): ChangeDisplayProps => {
  if (percentageChange === null) {
    return {
      text: DEFAULT_CHANGE_TEXT,
      color: 'text-muted-foreground',
      Icon: Minus,
    };
  }

  const getIconAndColor = (
    isPositive: boolean,
  ): { Icon: React.ElementType; color: string } => {
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const color =
      higherIsBetter === isPositive ? 'text-green-600' : 'text-red-600';
    return { Icon, color };
  };

  if (percentageChange === Infinity) {
    return { text: POSITIVE_INFINITY_CHANGE_TEXT, ...getIconAndColor(true) };
  }
  if (percentageChange === -Infinity) {
    return { text: NEGATIVE_INFINITY_CHANGE_TEXT, ...getIconAndColor(false) };
  }
  if (percentageChange !== 0) {
    const isPositiveTrend = percentageChange > 0;
    const { Icon, color } = getIconAndColor(isPositiveTrend);
    return {
      text: `${isPositiveTrend ? '+' : ''}${percentageChange.toFixed(1)}% ${DEFAULT_CHANGE_TEXT}`,
      color,
      Icon,
    };
  }
  return {
    text: DEFAULT_CHANGE_TEXT,
    color: 'text-muted-foreground',
    Icon: Minus,
  };
};

export interface ComparisonKpiCardProps {
  title: string;
  currentValue?: number;
  previousValue?: number;
  unit?: '%' | '$' | '';
  higherIsBetter?: boolean;
  isPercentage?: boolean;
}

export const ComparisonKpiCard: React.FC<ComparisonKpiCardProps> = ({
  title,
  currentValue,
  previousValue,
  unit = '',
  higherIsBetter = true,
  isPercentage = false,
}) => {
  const percentageChange = calculatePercentageChange(
    currentValue,
    previousValue,
  );
  const {
    text: changeText,
    color: changeColor,
    Icon: ChangeIcon,
  } = getChangeDisplayProperties(percentageChange, higherIsBetter);
  const displayValue =
    typeof currentValue === 'number'
      ? `${unit === '$' ? '$' : ''}${currentValue.toLocaleString(undefined, { minimumFractionDigits: isPercentage ? 1 : 2, maximumFractionDigits: isPercentage ? 1 : 2 })}${unit === '%' ? '%' : ''}`
      : 'N/A';
  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </h4>
        <div className="text-2xl font-bold">{displayValue}</div>
        <div className={`text-xs flex items-center ${changeColor} mt-1`}>
          <ChangeIcon className="h-3 w-3 mr-1" /> {changeText}
        </div>
      </CardContent>
    </Card>
  );
};
