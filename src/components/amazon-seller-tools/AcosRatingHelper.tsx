import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

/**
 * Props interface for the AcosRatingHelper component.
 * @property {number | null | undefined} acos - The ACoS value to rate.
 */
interface AcosRatingHelperProps {
  acos: number | null | undefined;
}

/**
 * `AcosRatingHelper` is a utility component that displays a rating (Excellent, Good, Okay, Poor)
 * and a corresponding color based on the provided ACoS (Advertising Cost of Sales) value.
 * It also provides a tooltip with the ACoS range for each rating.
 *
 * @param {AcosRatingHelperProps} props - The props for the component.
 * @param {number | null | undefined} props.acos - The ACoS value.
 * @returns {JSX.Element | null} A styled span with the ACoS rating and a tooltip, or null if acos is not provided.
 */
export const AcosRatingHelper: React.FC<AcosRatingHelperProps> = ({ acos }) => {
  if (acos === null || acos === undefined) {
    return null;
  }

  let rating: string;
  let colorClass: string;
  let tooltipText: string;

  if (acos <= 15) {
    rating = 'Excellent';
    colorClass = 'text-green-500';
    tooltipText = 'Excellent: ACoS <= 15%';
  } else if (acos <= 30) {
    rating = 'Good';
    colorClass = 'text-blue-500';
    tooltipText = 'Good: 15% < ACoS <= 30%';
  } else if (acos <= 50) {
    rating = 'Okay';
    colorClass = 'text-orange-500';
    tooltipText = 'Okay: 30% < ACoS <= 50%';
  } else {
    rating = 'Poor';
    colorClass = 'text-red-500';
    tooltipText = 'Poor: ACoS > 50%';
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`font-medium ${colorClass}`}>{rating}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};
