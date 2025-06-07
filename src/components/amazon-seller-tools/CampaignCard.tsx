'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { AcosRatingHelper } from '@/components/amazon-seller-tools/AcosRatingHelper'; // Use named import

/**
 * Defines the structure for various identifiers.
 */
export interface Identifier {
  asin: string;
  sku: string;
  upc: string;
  keyword: string;
}

/**
 * Defines the structure for campaign data.
 */
export interface CampaignData {
  name: string;
  type: string;
  acos?: number;
  ctr?: number;
  conversionRate?: number;
  spend: number;
  sales: number;
  status?: 'Active' | 'Paused' | 'Out of Budget' | 'Ended';
}

/**
 * Props interface for the CampaignCard component.
 * @property {CampaignData} campaign - The campaign data to display.
 */
interface CampaignCardProps {
  readonly campaign: CampaignData;
}

/**
 * `CampaignCard` displays key metrics and status for a single Amazon PPC campaign.
 * It provides a quick overview of campaign performance, including ACoS, CTR, conversion rate,
 * spend, and sales, along with a visual indicator for ACoS rating.
 *
 * @param {CampaignCardProps} props - The props for the component.
 * @param {CampaignData} props.campaign - The campaign data object.
 * @returns {JSX.Element} A card component displaying campaign information.
 */
export default function CampaignCard({ campaign }: CampaignCardProps) {
  // Helper to render status badge based on campaign status
  const renderStatusBadge = () => {
    switch (campaign.status) {
      case 'Active':
        return <Badge variant="default">Active</Badge>;
      case 'Paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'Out of Budget':
        return <Badge variant="destructive">Out of Budget</Badge>;
      case 'Ended':
        return <Badge variant="secondary">Ended</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {campaign.name}
            </h3>
            <Badge variant="outline" className="text-sm">
              {campaign.type}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-3">
            {campaign.acos !== undefined && (
              <span>ACoS: {campaign.acos.toFixed(2)}%</span>
            )}
            {campaign.ctr !== undefined && (
              <span>CTR: {campaign.ctr.toFixed(2)}%</span>
            )}
            {campaign.conversionRate !== undefined && (
              <span>
                Conversion Rate: {campaign.conversionRate.toFixed(2)}%
              </span>
            )}
          </div>
          {renderStatusBadge()}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-700">
                <div className="text-sm text-muted-foreground">Spend</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  ${campaign.spend.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-700">
                <div className="text-sm text-muted-foreground">Sales</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  ${campaign.sales.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-700">
                <div className="text-sm text-muted-foreground">ACoS</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  {campaign.acos !== undefined
                    ? `${campaign.acos.toFixed(2)}%`
                    : 'N/A'}
                  {campaign.acos !== undefined && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-gray-500 dark:text-gray-400 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm">
                          <AcosRatingHelper acos={campaign.acos} />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-700">
                <div className="text-sm text-muted-foreground">RoAS</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {campaign.spend > 0
                    ? (campaign.sales / campaign.spend).toFixed(2)
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
