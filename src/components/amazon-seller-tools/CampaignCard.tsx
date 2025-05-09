'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CampaignData } from './ppc-campaign-auditor';

export interface Identifier {
  asin: string;
  sku: string;
  upc: string;
  keyword: string;
}

interface CampaignCardProps {
  readonly campaign: CampaignData;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{campaign.name}</h3>
            <Badge variant="outline">{campaign.type}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            ACoS: {campaign.acos?.toFixed(2)}% • CTR: {campaign.ctr?.toFixed(2)}
            % • Conversion Rate: {campaign.conversionRate?.toFixed(2)}%
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Spend</div>
                <div className="text-xl font-semibold">
                  ${campaign.spend.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Sales</div>
                <div className="text-xl font-semibold">
                  ${campaign.sales.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
