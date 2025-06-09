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
import { z } from 'zod';
import {
  monetaryValueSchema,
  positiveNumberSchema,
} from '@/lib/input-validation';
import { AlertCircle, Download, Info, Upload, X, XCircle } from 'lucide-react';
import { AcosTrendChart } from './AcosTrendChart';
import type { ChangeEvent } from 'react';
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
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from '@/lib/constants';
import { CalculationData } from '@/lib/indexeddb-service';
import { ManualCalculationForm } from './ManualCalculationForm';
import { AcosRatingGuide } from './AcosRatingGuide';
import {
  calculateLocalMetrics,
  calculateAcosRoas,
} from '@/lib/amazon-tools/acos-calculator-utils';
import { CalculationHistoryTable } from './CalculationHistoryTable';
import {
  setItem,
  getCalculations,
  saveCalculation,
} from '@/lib/indexeddb-service';
import { useToast } from '@/app/hooks/use-toast';
import { exportToCSV } from '@/lib/amazon-tools/export-utils';
import AcosChart from './AcosChart';

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
    label: string;
    theme: { light: string; dark: string };
  };
};

// --- Component ---

export default function AcosCalculator() {
  const { toast } = useToast();

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
    // Filter out calculated metrics that are not directly from CSV or are internal
    return Object.keys(campaigns[0]).filter(
      (key) =>
        key !== 'campaign' &&
        key !== 'date' &&
        key !== 'acos' &&
        key !== 'roas' &&
        key !== 'ctr' &&
        key !== 'cpc' &&
        key !== 'revenuePerClickRate' &&
        key !== 'currencySymbol', // Exclude currencySymbol as it's not a chartable metric
    ) as (keyof CampaignData)[];
  }, [campaigns]);

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
          const validatedRow = validateCampaignRow(row, 0); // Basic structure validation
          // More robust numeric validation using Zod schemas
          const adSpend = positiveNumberSchema.parse(Number(row.adSpend));
          const sales = positiveNumberSchema.parse(Number(row.sales));
          const impressions = z
            .number()
            .min(0)
            .optional()
            .parse(Number(row.impressions));
          const clicks = z.number().min(0).optional().parse(Number(row.clicks));

          return {
            ...validatedRow,
            adSpend,
            sales,
            impressions,
            clicks,
          } as CampaignData;
        } catch (error) {
          throw new Error(
            `Invalid row data: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    },
    (error: Error) => {
      setError(undefined);
      setIsLoading(false);
      toast({
        title: 'CSV Parsing Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    (result: {
      data: CampaignData[];
      skippedRows: Array<{ index: number; reason: string }>;
    }) => {
      const dataWithMetrics = result.data.map((row) => {
        const { acos, roas } = calculateAcosRoas(row.adSpend, row.sales);
        const metrics = calculateLocalMetrics(
          row.adSpend,
          row.sales,
          selectedCurrency,
          row.impressions !== undefined ? String(row.impressions) : undefined,
          row.clicks !== undefined ? String(row.clicks) : undefined,
        );
        return {
          ...row,
          ...metrics,
          acos,
          roas,
          date: new Date().toISOString(),
        };
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
        toast({
          title: 'No file selected',
          description: 'Please select a CSV file to upload.',
          variant: 'destructive',
        });
        return;
      }
      setIsLoading(true);
      setError(undefined);
      csvParser
        .parseFile(file)
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred.';
          setError(errorMessage);
          toast({
            title: 'CSV Parsing Error',
            description: errorMessage,
            variant: 'destructive',
          });
          setIsLoading(false);
        });
    },
    [csvParser, toast],
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
      exportToCSV(exportData, 'acos_calculations.csv');
      toast({
        title: 'Export Successful',
        description: 'ACoS calculations exported to CSV.',
      });
    } catch (err) {
      console.error('Failed to export ACoS calculations:', err);
      toast({
        title: 'Export Failed',
        description: `Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      });
    }
  }, [campaigns, toast]);

  const clearData = useCallback(() => {
    setCampaigns([]);
    setError(undefined);
  }, []);

  const [manualCampaign, setManualCampaign] = useState({
    campaign: '',
    adSpend: '',
    sales: '',
    impressions: '',
    clicks: '',
  });

  const isManualInputValid = useMemo(() => {
    try {
      // Validate adSpend and sales using Zod schemas
      positiveNumberSchema.parse(Number.parseFloat(manualCampaign.adSpend));
      positiveNumberSchema.parse(Number.parseFloat(manualCampaign.sales));
      // Ensure campaign name is not empty
      return manualCampaign.campaign.trim() !== '';
    } catch (e) {
      return false;
    }
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
      // Validate inputs using Zod schemas for better error messages
      const adSpend = positiveNumberSchema.parse(
        Number.parseFloat(manualCampaign.adSpend),
      );
      const sales = positiveNumberSchema.parse(
        Number.parseFloat(manualCampaign.sales),
      );

      const { acos, roas } = calculateAcosRoas(adSpend, sales);

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
        acos, // Assign calculated ACoS
        roas, // Assign calculated ROAS
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

      // Save the calculation to IndexedDB
      try {
        const calculationData: CalculationData = {
          campaignName: newCampaign.campaign,
          adSpend: newCampaign.adSpend,
          sales: newCampaign.sales,
          acos: newCampaign.acos!,
          roas: newCampaign.roas!,
          date: new Date(newCampaign.date!).getTime(), // Convert ISO string date to timestamp
          currencySymbol: newCampaign.currencySymbol!,
        };
        await saveCalculation(calculationData); // Use saveCalculation
        setCalculationHistory((prevHistory) => [
          ...prevHistory,
          calculationData,
        ]); // Add calculationData to history
        toast({
          title: 'Calculation Added',
          description: `Campaign "${newCampaign.campaign}" added to history.`,
        });
      } catch (dbError) {
        console.error('Error saving calculation to IndexedDB:', dbError);
        toast({
          title: 'Database Error',
          description: 'Failed to save calculation history.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during manual calculation.';
      setError(errorMessage); // Still set local error state for display if needed
      toast({
        title: 'Calculation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedCurrency,
    manualCampaign,
    setError,
    setIsLoading,
    setCampaigns,
    setCalculationHistory,
    toast,
  ]);

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
              className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5 ${
                isDragActive ? 'border-primary bg-primary/10' : ''
              }`}
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
            isManualInputValid={isManualInputValid}
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
        <AcosChart
          isLoading={isLoading}
          campaigns={campaigns}
          selectedMetric={selectedMetric}
          chartConfig={chartConfig}
        />
      </div>
      <Button onClick={clearData}>Clear History</Button>
    </div>
  );
}
