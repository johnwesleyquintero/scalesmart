// Move 'use client' directive to the top of the file if not already present
'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
} from '@/components/ui'; // Corrected: Use import type for type-only imports
import { type MetricKey } from '@/lib/amazon-tools/types';
import { logError } from '@/lib/error-handling';
import {
  campaignHeaders,
  validateCampaignRow,
} from '@/lib/hooks/use-campaign-validator';
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import { monetaryValueSchema, numberSchema } from '@/lib/input-validation';
import { AlertCircle, Download, Info, Upload, X, XCircle } from 'lucide-react'; // Corrected: Use import type for type-only imports
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react'; // Corrected: Use import type for type-only imports
import { useDropzone } from 'react-dropzone';
// Import Recharts components
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SampleCsvButton from './sample-csv-button';

// --- Interfaces & Types ---

export interface CampaignData {
  campaign: string;
  adSpend: number;
  sales: number;
  // Corrected: Removed redundant | undefined
  impressions?: number;
  clicks?: number;
  acos?: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  revenuePerClickRate?: number;
}

// --- Constants ---

const acosRatingGuide = [
  { label: 'Excellent', range: '< 15%', color: 'text-green-500' },
  { label: 'Good', range: '15-25%', color: 'text-blue-500' },
  { label: 'Fair', range: '25-35%', color: 'text-yellow-500' },
  { label: 'Poor', range: '> 35%', color: 'text-red-500' },
];

const chartConfig = {
  acos: { label: 'ACoS (%)', theme: { light: '#8884d8', dark: '#8884d8' } },
  roas: { label: 'ROAS (x)', theme: { light: '#82ca9d', dark: '#82ca9d' } },
  ctr: { label: 'CTR (%)', theme: { light: '#ffc658', dark: '#ffc658' } },
  cpc: { label: 'CPC ($)', theme: { light: '#ff7300', dark: '#ff7300' } },
  revenuePerClickRate: {
    label: 'RPC Rate (%)',
    theme: { light: '#ff8042', dark: '#ff8042' },
  },
} as const satisfies {
  [key in MetricKey | 'revenuePerClickRate']: {
    label: string;
    theme: { light: string; dark: string };
  };
};

// Removed unused constant
// const RED_COLOR = 'text-red-500';

// --- Helper Functions ---

// Removed unused function getAcosColor

const calculateLocalMetrics = (
  adSpend: number,
  sales: number,
  impressions?: number,
  clicks?: number,
): Omit<
  CampaignData,
  'campaign' | 'adSpend' | 'sales' | 'impressions' | 'clicks'
> => {
  try {
    // Validate inputs
    const validatedAdSpend = monetaryValueSchema.parse(adSpend);
    const validatedSales = monetaryValueSchema.parse(sales);
    const validatedImpressions =
      impressions !== undefined ? numberSchema.parse(impressions) : undefined;
    const validatedClicks =
      clicks !== undefined ? numberSchema.parse(clicks) : undefined;

    // Handle edge cases for ACoS calculation
    const acos = (() => {
      if (validatedSales === 0 && validatedAdSpend === 0) return 0;
      if (validatedSales === 0) return Infinity;
      return (validatedAdSpend / validatedSales) * 100;
    })();

    // Handle edge cases for ROAS calculation
    const roas = (() => {
      if (validatedAdSpend === 0 && validatedSales === 0) return 0;
      if (validatedAdSpend === 0) return Infinity;
      return validatedSales / validatedAdSpend;
    })();

    // Safe handling of optional metrics
    const safeImpressions = validatedImpressions ?? 0;
    const safeClicks = validatedClicks ?? 0;

    // CTR calculation with proper edge case handling
    const ctr = safeImpressions > 0 ? (safeClicks / safeImpressions) * 100 : 0;

    // CPC calculation with proper edge case handling
    let cpc = 0;
    if (safeClicks > 0) {
      cpc = validatedAdSpend / safeClicks;
    } else if (validatedAdSpend > 0) {
      cpc = Infinity;
    }

    // Revenue per click rate with proper edge case handling
    let revenuePerClickRate = 0;
    if (safeClicks > 0) {
      revenuePerClickRate = (validatedSales / safeClicks) * 100;
    } else if (validatedSales > 0) {
      revenuePerClickRate = Infinity;
    }

    return { acos, roas, ctr, cpc, revenuePerClickRate };
  } catch (error) {
    logError({
      message: 'Error calculating metrics',
      component: 'AcosCalculator',
      severity: 'medium',
      error: error as Error,
      context: { adSpend, sales, impressions, clicks },
    });
    return { acos: 0, roas: 0, ctr: 0, cpc: 0, revenuePerClickRate: 0 };
  }
};

// --- Component ---

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof chartConfig>('acos');
  const [manualCampaign, setManualCampaign] = useState({
    campaign: '',
    adSpend: '',
    sales: '',
  });

  // Cleanup effect for memory leak prevention
  useEffect(() => {
    return () => {
      // Cleanup function to prevent state updates after unmount
      setCampaigns([]);
      setError(undefined);
      setIsLoading(false);
    };
  }, []);

  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum >= 0 &&
      !isNaN(salesNum) &&
      salesNum >= 0
    );
  }, [manualCampaign]);

  const csvParser = useCsvParser<CampaignData>(
    {
      requiredHeaders: campaignHeaders.required,
      validateRow: (row) => {
        try {
          const result = validateCampaignRow(row, 0);
          // Additional validation for numeric fields
          if (isNaN(Number(row.adSpend)) || isNaN(Number(row.sales))) {
            throw new Error('Ad spend and sales must be valid numbers');
          }
          return result as CampaignData;
        } catch (error) {
          throw new Error(
            `Invalid row data: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    },
    (error: Error) => {
      setError(`CSV Parsing Error: ${error.message}`);
      setIsLoading(false);
    },
    (result: {
      data: CampaignData[];
      skippedRows: Array<{ index: number; reason: string }>;
    }) => {
      const dataWithMetrics = result.data.map((row) => {
        const metrics = calculateLocalMetrics(
          Number(row.adSpend),
          Number(row.sales),
          Number(row.impressions) || undefined,
          Number(row.clicks) || undefined,
        );
        return { ...row, ...metrics };
      });
      setCampaigns(dataWithMetrics);
      setIsLoading(false);
      if (result.skippedRows.length > 0) {
        setError(
          `Processed with warnings: ${result.skippedRows.length} rows were skipped. First error: ${result.skippedRows[0].reason}`,
        );
      } else {
        setError(undefined);
      }
    },
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        setError('No file selected');
        return;
      }
      setIsLoading(true);
      setError(undefined);
      // Corrected: Call async function without making the callback async itself
      csvParser.parseFile(file).catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
    },
    [csvParser], // csvParser dependency is correct
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: isLoading,
  });

  const handleManualInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let sanitizedValue = value;
      if (name === 'adSpend' || name === 'sales') {
        sanitizedValue = value
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1')
          .replace(/^\./, '0.')
          .replace(/^0+(?=\d)/, '');
      } else if (name === 'campaign') {
        sanitizedValue = value.trimStart().slice(0, 100);
      }
      setManualCampaign((prev) => ({ ...prev, [name]: sanitizedValue }));
      setError(undefined);
    },
    [],
  );

  const handleManualCalculate = useCallback(() => {
    // Corrected: Use undefined instead of null
    setError(undefined);
    setIsLoading(true);
    try {
      if (!isManualInputValid) {
        if (!manualCampaign.campaign.trim())
          throw new Error('Please enter a campaign name.');
        const adSpend = Number.parseFloat(manualCampaign.adSpend);
        if (isNaN(adSpend) || adSpend < 0)
          throw new Error('Ad Spend must be a valid non-negative number.');
        const sales = Number.parseFloat(manualCampaign.sales);
        if (isNaN(sales) || sales < 0)
          throw new Error('Sales amount must be a valid non-negative number.');
        throw new Error('Invalid input. Please check values.');
      }
      const adSpend = Number.parseFloat(manualCampaign.adSpend);
      const sales = Number.parseFloat(manualCampaign.sales);
      const metrics = calculateLocalMetrics(adSpend, sales);
      const newCampaign: CampaignData = {
        campaign: manualCampaign.campaign.trim(),
        adSpend,
        sales,
        ...metrics,
      };
      setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
      setManualCampaign({ campaign: '', adSpend: '', sales: '' });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }, [manualCampaign, isManualInputValid]);

  const handleExport = useCallback(() => {
    if (campaigns.length === 0) {
      setError('No data to export.');
      return;
    }
    // Corrected: Use undefined instead of null
    setError(undefined);
    const exportData = campaigns.map((campaign) => ({
      campaign: campaign.campaign,
      adSpend: campaign.adSpend.toFixed(2),
      sales: campaign.sales.toFixed(2),
      acos:
        campaign.acos === Infinity
          ? 'Infinity'
          : (campaign.acos?.toFixed(2) ?? ''),
      roas:
        campaign.roas === Infinity
          ? 'Infinity'
          : (campaign.roas?.toFixed(2) ?? ''),
      impressions: campaign.impressions ?? '',
      clicks: campaign.clicks ?? '',
      ctr: campaign.ctr?.toFixed(2) ?? '',
      cpc: campaign.cpc?.toFixed(2) ?? '',
      revenuePerClickRate: campaign.revenuePerClickRate?.toFixed(2) ?? '',
    }));
    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'acos_calculations.csv');
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        `Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [campaigns]);

  const clearData = useCallback(() => {
    setCampaigns([]);
    // Corrected: Use undefined instead of null
    setError(undefined);
    setManualCampaign({ campaign: '', adSpend: '', sales: '' });
  }, []);

  // --- Chart Content Logic (Fix for sonarjs/no-nested-conditional) ---
  let chartContent;
  if (isLoading) {
    chartContent = (
      <div className="flex justify-center items-center h-80">
        <Progress value={undefined} className="w-1/2" /> {/* Indeterminate */}
        <p className="ml-4 text-muted-foreground">Loading chart...</p>
      </div>
    );
  } else if (campaigns.length > 0) {
    chartContent = (
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
            // Corrected: Use 'unknown' and type checks instead of 'any'
            formatter={(value: unknown) => {
              // Handle array case (less likely for simple BarChart but good practice)
              if (Array.isArray(value)) {
                const firstValue = value[0];
                if (firstValue === Infinity) return 'Infinity'; // Corrected: Use 'Infinity' string
                if (typeof firstValue === 'number')
                  return firstValue.toFixed(2);
                return firstValue ?? 'N/A';
              }
              // Handle single value case
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
    chartContent = (
      <div className="flex justify-center items-center h-80">
        <p className="text-muted-foreground">No data to display.</p>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How it Works:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Upload a CSV with columns: <code>campaign</code>,{' '}
              <code>adSpend</code>, <code>sales</code>. Optional:{' '}
              <code>impressions</code>, <code>clicks</code>.
            </li>
            <li>Or, manually enter data for a single campaign.</li>
            <li>
              The tool calculates ACoS (Advertising Cost of Sales), ROAS (Return
              on Ad Spend), and other PPC metrics if data is available.
            </li>
            <li>Visualize the distribution of a selected metric.</li>
            <li>Export the results to a new CSV file.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Campaign Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5 ${isDragActive ? 'border-primary bg-primary/10' : ''}`}
            >
              <input {...getInputProps()} disabled={isLoading} />
              <Upload className="mb-2 h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium">
                {isDragActive
                  ? 'Drop the CSV file here...'
                  : 'Click or drag CSV file here'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                (Requires: campaign, adSpend, sales)
              </span>
            </div>
            <SampleCsvButton
              dataType="acos"
              fileName="sample-acos-data.csv"
              className="mt-4 w-full"
              onClick={() =>
                console.log('SampleCsvButton clicked in acos-calculator.tsx')
              }
            />
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manual-campaign">Campaign Name*</Label>
              <Input
                id="manual-campaign"
                name="campaign"
                value={manualCampaign.campaign}
                onChange={handleManualInputChange}
                placeholder="e.g., SP - Auto - Product A"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="manual-adSpend">Ad Spend ($)*</Label>
              <Input
                id="manual-adSpend"
                name="adSpend"
                type="text"
                inputMode="decimal"
                value={manualCampaign.adSpend}
                onChange={handleManualInputChange}
                placeholder="e.g., 150.75"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="manual-sales">Sales ($)*</Label>
              <Input
                id="manual-sales"
                name="sales"
                type="text"
                inputMode="decimal"
                value={manualCampaign.sales}
                onChange={handleManualInputChange}
                placeholder="e.g., 600.50"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleManualCalculate}
              disabled={!isManualInputValid || isLoading}
              className="w-full"
            >
              {isLoading ? 'Calculating...' : 'Calculate & Add'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant={error.includes('warnings') ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {error.includes('warnings') ? 'Warning' : 'Error'}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            // Corrected: Use undefined instead of null
            onClick={() => setError(undefined)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Action Buttons Row */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={campaigns.length === 0 || isLoading}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
        {campaigns.length > 0 && (
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Data
          </Button>
        )}
      </div>

      {/* Metric Selection Buttons */}
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2">
        <span className="text-sm font-medium mr-2">View Metric:</span>
        {Object.entries(chartConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedMetric === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMetric(key as keyof typeof chartConfig)}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Charts Row */}
      {(campaigns.length > 0 || isLoading) && (
        <div className="grid grid-cols-1 gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {chartConfig[selectedMetric].label} Distribution
              </CardTitle>
            </CardHeader>
            {/* --- Use the chartContent variable here --- */}
            <CardContent>{chartContent}</CardContent>
          </Card>
        </div>
      )}

      {/* ACoS Rating Guide */}
      <Card>
        <CardHeader>
          <CardTitle>ACoS Rating Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {acosRatingGuide.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${item.color.replace('text-', 'bg-')}`}
                />
                <span className="font-medium">{item.label}:</span>
                <span className={`font-semibold ${item.color}`}>
                  {item.range}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Note: Ideal ACoS varies by product, category, and campaign goals.
            Lower ACoS generally indicates higher profitability from ads.
            Infinity ACoS means no sales were generated from ad spend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
