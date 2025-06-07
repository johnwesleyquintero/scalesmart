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
} from '@/components/ui';
import { type MetricKey } from '@/lib/amazon-tools/types';
import { CampaignData } from '@/lib/amazon-tools/metrics';
import { logError } from '@/lib/error-handling';
import {
  campaignHeaders,
  validateCampaignRow,
} from '@/lib/hooks/use-campaign-validator';
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import { monetaryValueSchema, numberSchema } from '@/lib/input-validation';
import { AlertCircle, Download, Info, Upload, X, XCircle } from 'lucide-react';
import { AcosTrendChart } from './AcosTrendChart';
import Papa from 'papaparse';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { CurrencySelector } from './CurrencySelector';
import { saveCalculation, getCalculations } from '@/lib/indexeddb-service';
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from '@/lib/constants';
import { format } from 'date-fns';
import { CalculationData } from '@/lib/indexeddb-service';
import { ManualCalculationForm } from './ManualCalculationForm';
import { AcosRatingGuide } from './AcosRatingGuide';
import {
  calculateLocalMetrics,
  calculateAcosRoas,
} from '@/lib/amazon-tools/acos-calculator-utils';
import { CalculationHistoryTable } from './CalculationHistoryTable';

// --- Interfaces & Types ---

// --- Constants ---

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
  [key in 'acos' | 'roas' | 'ctr' | 'cpc' | 'revenuePerClickRate']: {
    // Explicitly list keys present
    label: string;
    theme: { light: string; dark: string };
  };
};

// --- Component ---

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState({
    label: 'US Dollar',
    value: 'USD',
    symbol: '$',
  });
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof chartConfig>('acos');
  const [calculationHistory, setCalculationHistory] = useState<
    CalculationData[]
  >([]);

  // Add availableMetrics state
  const availableMetrics: (keyof CampaignData)[] = useMemo(() => {
    if (campaigns.length === 0) return [];
    return Object.keys(campaigns[0]).filter(
      (key) => key !== 'campaign' && key !== 'date',
    ) as (keyof CampaignData)[];
  }, [campaigns]);

  // Cleanup effect for memory leak prevention
  // No specific cleanup needed for this component's state.
  // The cleanup function is typically used for subscriptions, timers, etc.
  // Setting state to initial values on unmount is generally not necessary
  // and can sometimes lead to issues if the component is re-mounted quickly.

  // Load history on component mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getCalculations();
        setCalculationHistory(history);
      } catch (error) {
        console.error('Error loading calculation history:', error);
        setError('Error loading calculation history');
      }
    }
    loadHistory();
  }, []);

  const csvParser = useCsvParser<CampaignData>(
    {
      requiredHeaders: campaignHeaders.required,
      validateRow: (row) => {
        try {
          const result = validateCampaignRow(row, 0);
          // Additional validation for numeric fields
          const adSpend = Number(row.adSpend);
          const sales = Number(row.sales);

          if (isNaN(adSpend) || adSpend <= 0) {
            throw new Error('Ad spend must be a valid positive number');
          }

          if (isNaN(sales) || sales <= 0) {
            throw new Error('Sales must be a valid positive number');
          }
          const impressions = Number(row.impressions);
          const clicks = Number(row.clicks);

          if (isNaN(impressions) || impressions < 0) {
            throw new Error('Impressions must be a non-negative number');
          }

          if (isNaN(clicks) || clicks < 0) {
            throw new Error('Clicks must be a non-negative number');
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
        let acos: number | undefined;
        let roas: number | undefined;
        const adSpend = Number(row.adSpend);
        const sales = Number(row.sales);
        const date = new Date().toISOString();

        if (sales === 0) {
          acos = Infinity;
          roas = 0;
        } else {
          acos = (adSpend / sales) * 100;
          roas = sales / adSpend;
        }

        const metrics = calculateLocalMetrics(
          adSpend,
          sales,
          selectedCurrency,
          row.impressions !== undefined ? String(row.impressions) : undefined,
          row.clicks !== undefined ? String(row.clicks) : undefined,
        );
        return { ...row, ...metrics, acos, roas, date };
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
      csvParser.parseFile(file).catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
    },
    [csvParser],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: isLoading,
  });

  const handleExport = useCallback(() => {
    if (campaigns.length === 0) {
      setError('No data to export.');
      return;
    }
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
    setError(undefined);
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
    chartContent = (
      <div className="flex justify-center items-center h-80">
        <p className="text-muted-foreground">No data to display.</p>
      </div>
    );
  }

  const [manualCampaign, setManualCampaign] = useState({
    campaign: '',
    adSpend: '',
    sales: '',
    impressions: '',
    clicks: '',
  });

  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum > 0 &&
      !isNaN(salesNum) &&
      salesNum > 0
    );
  }, [manualCampaign]);

  const handleManualInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setManualCampaign((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleManualCalculate = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      const adSpend = Number.parseFloat(manualCampaign.adSpend);
      const sales = Number.parseFloat(manualCampaign.sales);

      if (sales === 0) {
        setError('Sales cannot be zero to calculate ACoS and ROAS.');
        setIsLoading(false);
        return;
      }

      const metrics = calculateLocalMetrics(
        adSpend,
        sales,
        selectedCurrency,
        manualCampaign.impressions || undefined,
        manualCampaign.clicks || undefined,
      );

      const newCampaign: CampaignData = {
        campaign: manualCampaign.campaign.trim(),
        adSpend,
        sales,
        ...metrics,
        date: new Date().toISOString(),
      };

      setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
      setManualCampaign({
        campaign: '',
        adSpend: '',
        sales: '',
        impressions: '',
        clicks: '',
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCurrency, manualCampaign, setError, setIsLoading, setCampaigns]);

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
              <code>AdSpend</code>, <code>Sales</code>. Optional:{' '}
              <code>Impressions</code>, <code>Clicks</code>.
            </li>
            <li>Or, manually enter data for a single campaign.</li>
            <li>
              The tool calculates ACoS (Advertising Cost of Sales), ROAS (Return
              on Ad Spend), and other PPC metrics if data is available.
            </li>
            <li>Visualize the distribution of a selected metric.</li>
            <li>Export the results to a new CSV file.</li>
            <li>View calculation history.</li>
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
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Calculation</CardTitle>
          </CardHeader>
          <ManualCalculationForm
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            manualCampaign={manualCampaign}
            setManualCampaign={setManualCampaign}
            handleManualCalculate={handleManualCalculate}
            isManualInputValid={isLoading}
            isLoading={isLoading}
          />
        </Card>
      </div>

      {/* ACoS Rating Guide */}
      <AcosRatingGuide />

      {/* Calculation History Table */}
      {calculationHistory.length > 0 && (
        <CalculationHistoryTable calculationHistory={calculationHistory} />
      )}
      <div className="w-full overflow-x-auto">
        <AcosTrendChart data={campaigns} availableMetrics={availableMetrics} />
      </div>
      <Button onClick={clearData}>Clear History</Button>
    </div>
  );
}
// --- End of Component ---
