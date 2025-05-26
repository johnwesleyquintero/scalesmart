import React from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface AcosRatingProps {
  acos: number | null | undefined;
}

const AcosRatingHelper: React.FC<AcosRatingProps> = ({ acos }) => {
  if (acos === null || acos === undefined) {
    return null;
  }

  let rating: string;
  let color: string;
  let tooltipText: string;

  if (acos <= 15) {
    rating = 'Excellent';
    color = 'green';
    tooltipText = 'Excellent: ACoS <= 15%';
  } else if (acos <= 30) {
    rating = 'Good';
    color = 'blue';
    tooltipText = 'Good: 15% < ACoS <= 30%';
  } else if (acos <= 50) {
    rating = 'Okay';
    color = 'orange';
    tooltipText = 'Okay: 30% < ACoS <= 50%';
  } else {
    rating = 'Poor';
    color = 'red';
    tooltipText = 'Poor: ACoS > 50%';
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span style={{ color }}>{rating}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default AcosRatingHelper;
