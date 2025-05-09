export interface CampaignMetrics {
  acos: number;
  roas: number;
  ctr?: number;
  conversionRate?: number;
  cpc?: number;
}

export const calculateMetrics = (
  adSpend: number,
  sales: number,
  impressions?: number,
  clicks?: number,
): CampaignMetrics => {
  const acos = (adSpend / sales) * 100;
  const roas = sales / adSpend;

  let ctr, conversionRate, cpc;

  if (impressions && clicks) {
    ctr = (clicks / impressions) * 100;
    conversionRate = (sales / clicks) * 100;
    cpc = adSpend / clicks;
  }

  return {
    acos,
    roas,
    ...(ctr && { ctr }),
    ...(conversionRate && { conversionRate }),
    ...(cpc && { cpc }),
  };
};

export const getAcosRating = (acos: number): string => {
  if (acos < 15) return 'Excellent';
  if (acos < 25) return 'Good';
  if (acos < 35) return 'Fair';
  return 'Poor';
};
