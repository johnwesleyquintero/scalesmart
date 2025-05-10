// Move 'use client' directive to the top of the file
'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Upload,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react'; // Import React

// Local/UI Imports
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CampaignCard from './CampaignCard';
import DataCard from './DataCard'; // Import DataCard
import SampleCsvButton from './sample-csv-button';

// --- Constants for Analysis ---
const HIGH_ACOS_THRESHOLD = 30; // %
const LOW_CTR_THRESHOLD = 0.3; // %
const LOW_CONVERSION_RATE_THRESHOLD = 8; // % - Assuming Sales/Clicks * 100
const LOW_CLICK_VOLUME_THRESHOLD = 100;
const GOOD_AUTO_ACOS_THRESHOLD = 20; // %

// --- Types ---
// Raw data structure expected from CSV after PapaParse dynamicTyping
interface RawCampaignData {
  name?: StringOrNull;
  type?: StringOrNull;
  spend?: NumberOrStringOrNull;
  sales?: NumberOrStringOrNull;
  impressions?: NumberOrStringOrNull;
  clicks?: NumberOrStringOrNull;
}

type StringOrNull = string | null | undefined; // Allow undefined as PapaParse might yield it
type NumberOrStringOrNull = number | string | null | undefined; // Allow undefined

// Processed and validated data structure
export type CampaignData = {
  name: string;
  type: string;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  acos: number; // Always calculated
  ctr: number; // Always calculated
  conversionRate: number; // Always calculated (Note: May be Sales/Click if 'sales' is revenue)
  issues: string[];
  recommendations: string[];
};

// Type for validated row before analysis
type ValidatedRow = {
  name: string;
  type: string;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
};

// --- Helper Functions ---

/**
 * Calculates PPC metrics safely, handling potential division by zero.
 */
function calculateMetrics(
  spend: number,
  sales: number,
  impressions: number,
  clicks: number,
): { acos: number; ctr: number; conversionRate: number } {
  const acos = sales > 0 ? (spend / sales) * 100 : Infinity;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  // NOTE: If 'sales' is revenue, this is Sales Per Click * 100, not true Conversion Rate.
  const conversionRate = clicks > 0 ? (sales / clicks) * 100 : 0;

  return { acos, ctr, conversionRate };
}

/**
 * Analyzes a single campaign's performance based on calculated metrics.
 */
function handleNoSalesCase(spend: number): {
  issues: string[];
  recommendations: string[];
} {
  const issues = ['No Sales Recorded'];
  const recommendations = [];

  if (spend > 0) {
    recommendations.push(
      'Investigate targeting, product appeal, and listing quality. Consider pausing if spend is significant.',
    );
  } else {
    recommendations.push(
      'Campaign has no spend and no sales. Review setup or consider activating if intended.',
    );
  }

  return { issues, recommendations };
}

function analyzeHighAcos(acos: number): {
  issues: string[];
  recommendations: string[];
} {
  return {
    issues: [`High ACoS (${acos.toFixed(1)}%)`],
    recommendations: [
      'Review search term reports and target performance. Reduce bids on unprofitable targets.',
      'Add negative keywords/ASINs to prevent irrelevant spend.',
    ],
  };
}

function analyzeLowCtr(ctr: number): {
  issues: string[];
  recommendations: string[];
} {
  return {
    issues: [`Low CTR (${ctr.toFixed(2)}%)`],
    recommendations: [
      'Improve ad relevance: check keywords, ad copy (if applicable), and main image.',
      'Ensure targeting is specific enough.',
    ],
  };
}

function analyzeLowConversionRate(conversionRate: number): {
  issues: string[];
  recommendations: string[];
} {
  return {
    issues: [`Low Conversion Rate (${conversionRate.toFixed(1)}%)`],
    recommendations: [
      'Optimize product detail page (title, bullets, description, images, A+ content, price, reviews).',
      'Ensure keywords/targets align closely with the product benefits and features.',
    ],
  };
}

function analyzeLowClickVolume(clicks: number): {
  issues: string[];
  recommendations: string[];
} {
  return {
    issues: [`Low Click Volume (${clicks})`],
    recommendations: [
      'Consider increasing bids strategically on relevant, high-potential targets.',
      'Review campaign budget; ensure it is not limiting performance.',
    ],
  };
}

function analyzeAutoCampaign(
  type: string,
  acos: number,
): { recommendations: string[] } {
  if (type.toLowerCase().includes('auto') && acos < GOOD_AUTO_ACOS_THRESHOLD) {
    return {
      recommendations: [
        'Harvest high-performing search terms/ASINs from this Auto campaign into Manual campaigns for granular control.',
      ],
    };
  }
  return { recommendations: [] };
}

function analyzeCampaignPerformance(
  campaign: Omit<CampaignData, 'issues' | 'recommendations'>,
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const { acos, ctr, conversionRate, clicks, type, spend } = campaign;

  if (!isFinite(acos)) {
    const noSalesResult = handleNoSalesCase(spend);
    issues.push(...noSalesResult.issues);
    recommendations.push(...noSalesResult.recommendations);
    // Return early if no sales, as other metrics might not be meaningful
    return { issues, recommendations };
  }

  // Analyze campaigns with sales
  if (acos > HIGH_ACOS_THRESHOLD) {
    const highAcosResult = analyzeHighAcos(acos);
    issues.push(...highAcosResult.issues);
    recommendations.push(...highAcosResult.recommendations);
  }

  if (ctr < LOW_CTR_THRESHOLD) {
    const lowCtrResult = analyzeLowCtr(ctr);
    issues.push(...lowCtrResult.issues);
    recommendations.push(...lowCtrResult.recommendations);
  }

  if (conversionRate < LOW_CONVERSION_RATE_THRESHOLD) {
    const lowConvResult = analyzeLowConversionRate(conversionRate);
    issues.push(...lowConvResult.issues);
    recommendations.push(...lowConvResult.recommendations);
  }

  if (clicks < LOW_CLICK_VOLUME_THRESHOLD) {
    const lowClickResult = analyzeLowClickVolume(clicks);
    issues.push(...lowClickResult.issues);
    recommendations.push(...lowClickResult.recommendations);
  }

  const autoCampaignResult = analyzeAutoCampaign(type, acos);
  recommendations.push(...autoCampaignResult.recommendations);

  // Add default messages if no specific issues/recommendations were found after analysis
  if (issues.length === 0) {
    issues.push('No major performance issues detected.');
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Performance looks stable. Continue monitoring key metrics.',
    );
  }

  return { issues, recommendations };
}

/**
 * Validates a single raw row from the CSV.
 * Returns a validated row object or null if validation fails.
 */
function validateRow(
  row: unknown,
  rowIndex: number,
): { data: ValidatedRow | null; error: string | null } {
  const item = row as RawCampaignData;

  // Basic structure check
  if (
    typeof item !== 'object' ||
    item === null ||
    !item.name ||
    !item.type ||
    item.spend === undefined || // Check for undefined/null explicitly
    item.spend === null ||
    item.sales === undefined ||
    item.sales === null ||
    item.impressions === undefined ||
    item.impressions === null ||
    item.clicks === undefined ||
    item.clicks === null
  ) {
    return { data: null, error: 'Missing required fields' };
  }

  // Type validation and conversion
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  const type = typeof item.type === 'string' ? item.type.trim() : '';

  // Use Number() for potentially mixed types, then check isNaN and range
  const spend =
    typeof item.spend === 'number' ? item.spend : Number(item.spend);
  const sales =
    typeof item.sales === 'number' ? item.sales : Number(item.sales);
  const impressions =
    typeof item.impressions === 'number'
      ? item.impressions
      : Number(item.impressions);
  const clicks =
    typeof item.clicks === 'number' ? item.clicks : Number(item.clicks);

  // Detailed validation
  if (!name) {
    return { data: null, error: 'Invalid or missing campaign name' };
  }
  if (!type) {
    return { data: null, error: 'Invalid or missing campaign type' };
  }
  if (isNaN(spend) || spend < 0) {
    return { data: null, error: 'Invalid or negative spend amount' };
  }
  if (isNaN(sales) || sales < 0) {
    return { data: null, error: 'Invalid or negative sales amount' };
  }
  // Impressions and clicks should be whole numbers
  if (isNaN(impressions) || impressions < 0 || !Number.isInteger(impressions)) {
    return { data: null, error: 'Invalid or negative impressions count' };
  }
  if (isNaN(clicks) || clicks < 0 || !Number.isInteger(clicks)) {
    return { data: null, error: 'Invalid or negative clicks count' };
  }

  return {
    data: { name, type, spend, sales, impressions, clicks },
    error: null,
  };
}

/**
 * Processes raw data parsed from CSV into structured CampaignData.
 * Refactored for lower complexity.
 */
function processRawCampaignData(rawData: unknown[]): {
  data: CampaignData[];
  skippedRows: number;
  errors: { row: number; message: string }[];
} {
  const processedData: CampaignData[] = [];
  const errors: { row: number; message: string }[] = [];

  if (!Array.isArray(rawData)) {
    // Handle cases where rawData might not be an array (e.g., PapaParse error)
    return {
      data: [],
      skippedRows: 0,
      errors: [
        {
          row: 0,
          message: 'Invalid input: Expected an array of campaign data.',
        },
      ],
    };
  }

  rawData.forEach((row, index) => {
    const rowIndex = index + 1; // User-friendly row number (1-based)
    const validationResult = validateRow(row, rowIndex);

    if (validationResult.error || !validationResult.data) {
      errors.push({
        row: rowIndex,
        message: validationResult.error || 'Unknown validation error',
      });
    } else {
      try {
        const validatedData = validationResult.data;
        const metrics = calculateMetrics(
          validatedData.spend,
          validatedData.sales,
          validatedData.impressions,
          validatedData.clicks,
        );
        const baseCampaignData = {
          ...validatedData,
          ...metrics,
        };
        const analysis = analyzeCampaignPerformance(baseCampaignData);

        processedData.push({
          ...baseCampaignData,
          ...analysis,
        });
      } catch (error) {
        errors.push({
          row: rowIndex,
          message:
            'Error during analysis: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
        });
      }
    }
  });

  const skippedRows = errors.length;
  return { data: processedData, skippedRows, errors };
}

// --- Component ---
export default function PpcCampaignAuditor() {
  // --- State Declarations (Moved to top) ---
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<
    { row: number; message: string }[]
  >([]);
  const [skippedRows, setSkippedRows] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Callbacks (Moved after state) ---
  const processCampaignDataCallback = useCallback(
    (rawData: unknown[]) => {
      try {
        const {
          data,
          skippedRows: skipped,
          errors: validationErrs,
        } = processRawCampaignData(rawData);
        setCampaigns(data);
        setSkippedRows(skipped);
        setValidationErrors(validationErrs);

        // Set general error message based on processing results
        if (data.length === 0 && rawData.length > 0) {
          setError(
            `No valid campaign data found after processing ${rawData.length} rows. Check data integrity and formats. ${skipped} rows skipped.`,
          );
        } else if (skipped > 0) {
          setError(
            `Processed ${data.length} campaigns. Skipped ${skipped} invalid rows. See details below.`,
          ); // Use general error state for warnings too
        } else if (data.length > 0) {
          setError(undefined); // Clear error on success
        } else {
          setError(
            'The uploaded CSV file appears to be empty or contains no processable data rows.',
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An unknown processing error occurred',
        );
        setCampaigns([]);
        setSkippedRows(0);
        setValidationErrors([]);
      }
    },
    [setCampaigns, setError, setSkippedRows, setValidationErrors], // Add setters to dependencies
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(undefined);
      setValidationErrors([]); // Clear specific validation errors on new upload
      setSkippedRows(0);
      setCampaigns([]); // Clear previous results

      Papa.parse(file, {
        header: true,
        dynamicTyping: false, // Parse as strings initially for robust validation
        skipEmptyLines: true,
        complete: (result) => {
          setIsLoading(false); // Stop loading indicator

          if (result.errors.length > 0) {
            setError(
              `Error parsing CSV: ${result.errors[0].message}. Check row ${result.errors[0].row}.`,
            );
            return;
          }

          const requiredHeaders = [
            'name',
            'type',
            'spend',
            'sales',
            'impressions',
            'clicks',
          ];
          const actualHeaders =
            result.meta.fields?.map((h) => h.toLowerCase()) || []; // Case-insensitive check
          const missingHeaders = requiredHeaders.filter(
            (header) => !actualHeaders.includes(header),
          );

          if (missingHeaders.length > 0) {
            setError(
              `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${actualHeaders.join(', ') || 'None'}`,
            );
            return;
          }

          processCampaignDataCallback(result.data); // Use the memoized callback

          // Reset file input value
          if (event.target) {
            event.target.value = '';
          }
        },
        error: (err: Error) => {
          setError(`Error reading CSV file: ${err.message}`);
          setIsLoading(false);
          // Reset file input on read error too
          if (event.target) {
            event.target.value = '';
          }
        },
      });
    },
    [
      processCampaignDataCallback,
      setIsLoading,
      setError,
      setValidationErrors,
      setSkippedRows,
      setCampaigns,
    ], // Add setters
  );

  const handleExport = useCallback(() => {
    if (campaigns.length === 0) {
      setError('No data to export.');
      return;
    }
    setError(undefined);

    const exportData = campaigns.map((campaign) => ({
      Name: campaign.name,
      Type: campaign.type,
      Spend: campaign.spend.toFixed(2),
      Sales: campaign.sales.toFixed(2),
      ACoS_Percent: isFinite(campaign.acos) ? campaign.acos.toFixed(2) : 'N/A',
      Impressions: campaign.impressions,
      Clicks: campaign.clicks,
      CTR_Percent: campaign.ctr.toFixed(2),
      ConversionRate_Percent: isFinite(campaign.conversionRate)
        ? campaign.conversionRate.toFixed(2)
        : 'N/A',
      Issues: campaign.issues.join('; '),
      Recommendations: campaign.recommendations.join('; '),
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ppc_campaign_audit.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (expError) {
      console.error('Export error:', expError);
      setError(
        `Failed to generate CSV: ${expError instanceof Error ? expError.message : 'Unknown error'}.`,
      );
    }
  }, [campaigns, setError]); // Added setError

  const clearData = useCallback(() => {
    setCampaigns([]);
    setError(undefined);
    setValidationErrors([]);
    setSkippedRows(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setCampaigns, setError, setValidationErrors, setSkippedRows]); // Added setters

  // --- Sub-Components (Moved after hooks) ---
  const ErrorDisplay = () => {
    // Display general error OR specific validation errors
    const hasGeneralError = error && !error.startsWith('Processed'); // Don't show general error if it's just a warning about skipped rows
    const hasValidationErrs = validationErrors.length > 0;

    if (!hasGeneralError && !hasValidationErrs) return undefined;

    return (
      <div className="mt-4 p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            {hasGeneralError && <p className="font-semibold">{error}</p>}
            {hasValidationErrs && (
              <div className={hasGeneralError ? 'mt-2' : ''}>
                <p className="font-semibold mb-1">Validation Errors:</p>
                <ul className="list-disc list-inside text-sm space-y-1 max-h-40 overflow-y-auto">
                  {validationErrors.map((err, index) => (
                    <li key={index}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setError(undefined);
              setValidationErrors([]);
            }}
            className="text-red-700 h-6 w-6 flex-shrink-0 ml-2"
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const ProcessingStatus = () => {
    // Show status only if loading is finished and there was some processing
    if (isLoading || (campaigns.length === 0 && skippedRows === 0))
      return undefined;

    const message =
      skippedRows > 0
        ? `Processed ${campaigns.length} campaigns (${skippedRows} rows skipped due to errors).`
        : `Successfully processed ${campaigns.length} campaigns.`;

    return (
      <div className="mt-4 p-3 border border-blue-200 rounded-md bg-blue-50 text-blue-700 text-sm">
        <div className="flex items-center">
          <Info className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{message}</span>
        </div>
      </div>
    );
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Required columns (case-insensitive headers): <code>name</code>,{' '}
              <code>type</code>, <code>spend</code>, <code>sales</code>,{' '}
              <code>impressions</code>, <code>clicks</code>
            </li>
            <li>
              Numeric columns (spend, sales, impressions, clicks) must contain
              valid numbers (e.g., 123.45 or 123). Avoid currency symbols or
              commas within numbers. Impressions/clicks must be whole numbers.
            </li>
            <li>
              Example Row:{' '}
              <code>
                SP - Product Targeting,Sponsored Products,55.20,310.50,8500,150
              </code>
            </li>
          </ul>
        </div>
      </div>

      {/* Upload Card */}
      <DataCard>
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Upload Campaign Report</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV report from Amazon Advertising.
            </p>
          </div>
          <div className="w-full max-w-md">
            <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
              <FileText className="mb-2 h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium">
                Click or drag CSV file here
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                (Requires: name, type, spend, sales, impressions, clicks)
              </span>
              <input
                type="file"
                accept=".csv, text/csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
                ref={fileInputRef}
              />
            </label>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
              <SampleCsvButton
                dataType="ppc" // Corrected: Added dataType prop
                fileName="sample-ppc-campaign.csv"
              />
              {campaigns.length > 0 && !isLoading && (
                <Button variant="outline" onClick={clearData}>
                  Clear Results
                </Button>
              )}
            </div>
          </div>
        </div>
      </DataCard>

      {/* Error Display */}
      <ErrorDisplay />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Analyzing campaign performance...
          </p>
        </div>
      )}

      {/* Processing Status */}
      <ProcessingStatus />

      {/* Results Section */}
      {campaigns.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b pb-3">
              <h2 className="text-xl font-semibold">
                Audit Results ({campaigns.length} Campaigns)
              </h2>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Audit Report
              </Button>
            </div>
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                <Card key={`${campaign.name}-${index}`}>
                  <CardContent className="p-4">
                    <CampaignCard campaign={campaign} />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                          Detected Issues ({campaign.issues.length})
                        </h4>
                        {campaign.issues.length > 0 &&
                        !campaign.issues.includes(
                          'No major performance issues detected.',
                        ) ? (
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                            {campaign.issues.map((issue, i) => (
                              <li key={`issue-${index}-${i}`}>{issue}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            None
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                          Recommendations ({campaign.recommendations.length})
                        </h4>
                        {campaign.recommendations.length > 0 &&
                        !campaign.recommendations.includes(
                          'Performance looks stable. Continue monitoring key metrics.',
                        ) ? (
                          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                            {campaign.recommendations.map((rec, i) => (
                              <li key={`rec-${index}-${i}`}>{rec}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            None
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </DataCard>
      )}
    </div>
  );
}
