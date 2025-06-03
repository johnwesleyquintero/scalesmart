import { Currency } from '@/components/amazon-seller-tools/CurrencySelector';

export const calculateLocalMetrics = (
  adSpend: number,
  sales: number,
  selectedCurrency: Currency,
  impressions?: string,
  clicks?: string,
) => {
  let ctr: number | undefined;
  let cpc: number | undefined;
  let revenuePerClickRate: number | undefined;

  if (impressions !== undefined && clicks !== undefined) {
    const impressionsNum = Number(impressions);
    const clicksNum = Number(clicks);

    if (!isNaN(impressionsNum) && !isNaN(clicksNum) && impressionsNum > 0) {
      ctr = (clicksNum / impressionsNum) * 100;
      cpc = adSpend / clicksNum;
      revenuePerClickRate = (sales / clicksNum) * 100;
    }
  }

  const currencySymbol = selectedCurrency?.symbol || '$';

  return {
    ctr,
    cpc,
    revenuePerClickRate,
    currencySymbol,
  };
};

export const calculateAcosRoas = (adSpend: number, sales: number) => {
  let acos: number | undefined;
  let roas: number | undefined;

  if (sales === 0) {
    acos = Infinity;
    roas = 0;
  } else {
    acos = (adSpend / sales) * 100;
    roas = sales / adSpend;
  }

  return { acos, roas };
};
