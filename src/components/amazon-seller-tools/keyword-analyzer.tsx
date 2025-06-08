'use client';

import { useToast } from '@/hooks/use-toast.ts';
import { fetchKeywordAnalysis } from '@/lib/api/keyword-analysis.ts';
import { logError } from '@/lib/error-handling';
import { type KeywordAnalysis } from '@/lib/keyword-intelligence';
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useRef, useState, useEffect } from 'react';
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

// Local/UI Imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import DataCard from './DataCard';

// Utility Imports
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import { exportToCSV } from '@/lib/amazon-tools/export-utils';
import {
  keywordAnalyzerHeaders,
  validateKeywordAnalyzerRow,
  KeywordAnalyzerCsvRow,
} from '@/lib/hooks/use-keyword-analyzer-validator';

// --- Constants ---
const BATCH_SIZE = 50; // Process keywords in batches
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// --- Types ---
type KeywordData = {
  product: string;
  keywords: string[];
  searchVolume: number | undefined;
  competition: 'Low' | 'Medium' | 'High' | undefined;
  analysis: KeywordAnalysis[];
  suggestions?: string[];
  prohibitedCount: number;
  averageScore: number;
  averageConfidence: number;
};

// Gets badge variant based on competition level
const getCompetitionVariant = (
  competition?: 'Low' | 'Medium' | 'High',
): 'default' | 'outline' | 'destructive' => {
  switch (competition) {
    case 'Low':
      return 'default'; // Use 'default' for positive/low
    case 'Medium':
      return 'outline';
    case 'High':
      return 'destructive';
    default:
      return 'outline'; // Default if undefined
  }
};

// --- Sub-Components ---

const KeywordAnalyzerInfoBox: React.FC = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
    <div className="text-sm text-blue-700 dark:text-blue-300">
      <p className="font-medium">How it Works:</p>
      <ul className="list-disc list-inside ml-4">
        <li>
          Upload a CSV with 'product' and comma-separated 'keywords' columns.
          Optional: 'searchVolume', 'competition' (Low/Medium/High).
        </li>
        <li>Or, manually enter comma-separated keywords for quick analysis.</li>
        <li>
          The tool analyzes each keyword's potential (score, confidence,
          prohibited status).
        </li>
        <li>
          View keyword scores, identify prohibited terms, and see suggestions
          for high-potential keywords.
        </li>
        <li>Export the detailed analysis results to a CSV file.</li>
      </ul>
    </div>
  </div>
);

interface CsvUploadSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const CsvUploadSection: React.FC<CsvUploadSectionProps> = ({
  onFileUpload,
  isLoading,
  fileInputRef,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium">Upload Keywords CSV</CardTitle>
      <p className="text-xs text-muted-foreground">
        Bulk analyze keywords from a CSV file
      </p>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="w-full">
          <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
            <FileText className="mb-2 h-8 w-8 text-primary/60" />
            <span className="text-sm font-medium">
              Click or drag CSV file here
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              (Requires: product, keywords)
            </span>
            <input
              type="file"
              accept=".csv, text/csv"
              className="hidden"
              onChange={onFileUpload}
              disabled={isLoading}
              ref={fileInputRef}
              aria-label="Upload CSV file"
            />
          </label>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface ManualAnalysisSectionProps {
  manualKeywords: string;
  onKeywordsChange: (value: string) => void;
  onAnalyze: () => Promise<void>;
  isLoading: boolean;
}

const ManualAnalysisSection: React.FC<ManualAnalysisSectionProps> = ({
  manualKeywords,
  onKeywordsChange,
  onAnalyze,
  isLoading,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium">
        Manual Keyword Analysis
      </CardTitle>
      <p className="text-xs text-muted-foreground">Analyze keywords manually</p>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <Label htmlFor="manual-keywords" className="text-sm font-medium">
            Keywords*
          </Label>
          <Input
            id="manual-keywords"
            type="text"
            value={manualKeywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder="Enter comma-separated keywords (e.g., red shirt, cotton shirt)"
            className="mt-1"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate keywords with commas.
          </p>
        </div>
        <Button
          onClick={onAnalyze}
          className="w-full"
          disabled={isLoading || !manualKeywords.trim()}
        >
          <Search className="mr-2 h-4 w-4" />
          {isLoading ? 'Analyzing...' : 'Analyze Keywords'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

interface ActionButtonsProps {
  onExport: () => void;
  onClear: () => void;
  isLoading: boolean;
  hasData: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onExport,
  onClear,
  isLoading,
  hasData,
}) =>
  hasData && !isLoading ? (
    <div className="flex justify-end gap-2 mb-6">
      <Button variant="outline" onClick={onExport} disabled={isLoading}>
        <Download className="mr-2 h-4 w-4" />
        Export Results
      </Button>
      <Button variant="destructive" onClick={onClear} disabled={isLoading}>
        <XCircle className="mr-2 h-4 w-4" />
        Clear Results
      </Button>
    </div>
  ) : null;

interface ErrorDisplayProps {
  error: string | null;
  onErrorDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onErrorDismiss,
}) =>
  error ? (
    <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span className="flex-grow break-words">{error}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onErrorDismiss}
        className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0"
        aria-label="Dismiss error"
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  ) : null;

interface LoadingIndicatorProps {
  isLoading: boolean;
  progress: number | null;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  progress,
}) =>
  isLoading ? (
    <div className="space-y-2 py-4 text-center">
      <Progress
        value={progress !== null ? progress : undefined}
        className="h-2 w-1/2 mx-auto"
      />
      <p className="text-sm text-muted-foreground">
        {progress !== null
          ? `Processing: ${progress}%`
          : 'Analyzing keywords...'}
      </p>
    </div>
  ) : null;

interface AnalysisResultsProps {
  products: KeywordData[];
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ products }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium">
        Analysis Results ({products.length} Products)
      </CardTitle>
      <p className="text-xs text-muted-foreground">
        Detailed analysis for your keywords
      </p>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {products.map((product, index) => (
          <ProductAnalysisCard key={index} product={product} index={index} />
        ))}
      </div>
    </CardContent>
  </Card>
);

interface ProductAnalysisCardProps {
  product: KeywordData;
  index: number;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  product,
  index,
}) => (
  <Card>
    <CardContent className="p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <h3 className="text-lg font-medium break-all">{product.product}</h3>
        {/* Wrap badges in a div for flexbox styling */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {product.searchVolume !== undefined && (
            <>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Search Vol:
              </span>
              <Badge variant="outline">
                {product.searchVolume.toLocaleString()}
              </Badge>
            </>
          )}
          {product.competition && (
            <>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Competition:
              </span>
              <Badge variant={getCompetitionVariant(product.competition)}>
                {product.competition}
              </Badge>
            </>
          )}
          {product.prohibitedCount > 0 && (
            <Badge variant="destructive">
              {product.prohibitedCount} Prohibited
            </Badge>
          )}
        </div>
      </div>

      {/* Keywords & Analysis Section */}
      <div className="space-y-4">
        {/* Original Keywords List */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Original Keywords ({product.keywords.length})
          </h4>
          <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-3 min-h-[50px]">
            {product.keywords.length > 0 ? (
              product.keywords.map((keyword, i) => (
                <Badge
                  key={`orig-${index}-${i}`}
                  variant="outline"
                  className="text-xs"
                >
                  {keyword}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No keywords provided.
              </p>
            )}
          </div>
        </div>

        {/* Keyword Analysis Chart */}
        {product.analysis && product.analysis.length > 0 ? (
          <div className="h-80 w-full">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Keyword Analysis Scores
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={product.analysis}
                margin={{ top: 5, right: 5, left: -10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="keyword"
                  tick={{ fontSize: 10 }}
                  angle={-40}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: '12px', padding: '5px 10px' }}
                  formatter={(
                    value:
                      | number
                      | string
                      | null
                      | undefined
                      | (number | string)[],
                    name: string,
                    props: {
                      payload?: { isProhibited: boolean; keyword: string };
                    },
                  ):
                    | [string | React.ReactElement, string | React.ReactElement]
                    | null
                    | undefined => {
                    if (!props || !props.payload) {
                      return null;
                    }
                    const {
                      payload,
                    }: {
                      payload?: { isProhibited: boolean; keyword: string };
                    } = props;
                    const actualValue = Array.isArray(value) ? value[0] : value;
                    const formattedValue =
                      typeof actualValue === 'number'
                        ? actualValue?.toFixed(2)
                        : '0.00';
                    return [
                      `${formattedValue} ${payload?.isProhibited ? '(Prohibited)' : ''}`,
                      'Score',
                    ];
                  }}
                  labelFormatter={(label: string) => `Keyword: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="score"
                  name="Analysis Score"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                ></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Keyword Analysis Scores
            </h4>
            <p className="text-sm text-muted-foreground italic">
              No analysis data available.
            </p>
          </div>
        )}

        {/* Suggestions */}
        {product.suggestions && product.suggestions.length > 0 && (
          <div className="pt-4 border-t border-dashed">
            <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Suggested Keywords (High Potential)
            </h4>
            <div className="flex flex-wrap gap-1">
              {product.suggestions.map((keyword, i) => (
                <Badge
                  key={`sugg-${index}-${i}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// --- Main Component ---
export default function KeywordAnalyzer({
  initialKeyword,
}: {
  initialKeyword?: string | null;
}) {
  const { toast } = useToast();
  const [products, setProducts] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKeywords, setManualKeywords] = useState('');
  const [progress, setProgress] = useState<number | null>(null); // Moved progress state here
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to set initial keyword if provided from URL params
  useEffect(() => {
    if (initialKeyword && initialKeyword.trim() !== '') {
      setManualKeywords(initialKeyword);
      // Optionally trigger analysis directly, or let user click analyze
      // handleManualAnalysis(); // Uncomment this line if you want to auto-analyze
    }
  }, [initialKeyword]);

  // --- Handlers ---

  /**
   * Processes parsed CSV data rows and performs keyword analysis.
   * @param data The parsed CSV data rows.
   * @param totalRows The total number of rows for progress calculation.
   * @param onProgress A callback function to update progress.
   * @returns A promise resolving to an array of processed KeywordData.
   */
  const processCsvData = async (
    data: KeywordAnalyzerCsvRow[],
    totalRows: number,
    onProgress: (progress: number) => void,
  ): Promise<{ processedProducts: KeywordData[]; skippedCount: number }> => {
    let skippedRowCount = 0;
    const processedProducts: KeywordData[] = [];

    for (let i = 0; i < totalRows; i++) {
      const row = data[i];
      const productName = row.product?.trim();
      const keywords =
        row.keywords
          ?.split(',')
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean) ?? [];

      if (!productName || keywords.length === 0) {
        skippedRowCount++;
        console.warn(
          `Skipping row ${i + 2} due to missing product name or keywords.`,
        );
        onProgress(Math.round(((i + 1) / totalRows) * 100));
        continue;
      }

      try {
        const analysis = await fetchKeywordAnalysis(keywords);

        const searchVolumeRaw = row.searchvolume;
        const searchVolume =
          searchVolumeRaw && !isNaN(Number(searchVolumeRaw))
            ? Number(searchVolumeRaw)
            : undefined;

        const competitionRaw = row.competition?.trim().toLowerCase();
        const competition =
          competitionRaw &&
          (competitionRaw === 'low' ||
            competitionRaw === 'medium' ||
            competitionRaw === 'high')
            ? ((competitionRaw.charAt(0).toUpperCase() +
                competitionRaw.slice(1)) as 'Low' | 'Medium' | 'High')
            : undefined;

        const prohibitedCount = analysis.filter((a) => a.isProhibited).length;
        const totalScore = analysis.reduce((sum, a) => sum + a.score, 0);
        const totalConfidence = analysis.reduce(
          (sum, a) => sum + a.confidence,
          0,
        );
        const averageScore =
          analysis.length > 0 ? totalScore / analysis.length : 0;
        const averageConfidence =
          analysis.length > 0 ? totalConfidence / analysis.length : 0;

        const suggestions = analysis
          .filter(
            (a) => !a.isProhibited && a.score >= 70 && a.confidence >= 0.8,
          )
          .map((a) => a.keyword);

        processedProducts.push({
          product: productName,
          keywords,
          searchVolume,
          competition,
          analysis,
          suggestions,
          prohibitedCount,
          averageScore,
          averageConfidence,
        });
      } catch (analysisError) {
        skippedRowCount++;
        console.warn(
          `Skipping row ${i + 2} for "${productName}" due to analysis error: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`,
        );
      }
      onProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    return { processedProducts, skippedCount: skippedRowCount };
  };

  /**
   * CSV parser instance using the custom hook.
   * It handles parsing, initial row validation, and provides callbacks for success/error.
   */
  const csvParser = useCsvParser<KeywordAnalyzerCsvRow>(
    {
      requiredHeaders: keywordAnalyzerHeaders.required,
      validateRow: (row) =>
        validateKeywordAnalyzerRow(row as Record<string, string>, 0), // Explicitly cast to string record
    },
    (parseError: Error) => {
      setError(null); // Clear previous error
      setIsLoading(false);
      setProgress(null);
      toast({
        title: 'CSV Parsing Error',
        description: parseError.message,
        variant: 'destructive',
      });
    },
    async (result: {
      data: KeywordAnalyzerCsvRow[];
      skippedRows: Array<{ index: number; reason: string }>;
    }) => {
      if (result.data.length === 0) {
        const msg =
          result.skippedRows.length > 0
            ? `No valid data found in the CSV after initial parsing. ${result.skippedRows.length} rows were skipped.`
            : 'The uploaded CSV file appears to be empty or contains no data rows.';
        setError(msg);
        setIsLoading(false);
        setProgress(null);
        toast({
          title: 'Processing Failed',
          description: msg,
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        return;
      }

      const { processedProducts, skippedCount } = await processCsvData(
        result.data,
        result.data.length,
        setProgress,
      );

      if (processedProducts.length === 0) {
        const msg =
          result.data.length > 0
            ? `No valid product/keyword data found in the CSV after analysis. Skipped ${skippedCount} rows.`
            : 'The uploaded CSV file appears to be empty or contains no data rows.';
        setError(msg);
        toast({
          title: 'Processing Failed',
          description: msg,
          variant: 'destructive',
        });
      } else {
        setProducts(processedProducts);
        setError(null);
        const processedMessage = `Processed ${processedProducts.length} products`;
        const skippedMessage =
          skippedCount > 0 ? ` Skipped ${skippedCount} invalid rows` : '';
        toast({
          title: 'Analysis Complete',
          description: `${processedMessage}.${skippedMessage}`,
          variant: 'success',
        });
      }
      setIsLoading(false);
      setProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    },
  );

  /**
   * Handles the file upload event, initiating CSV parsing.
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setError('No file selected.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setProducts([]);
      setProgress(0);

      if (file.size > MAX_FILE_SIZE) {
        const msg = `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
        setError(msg);
        setIsLoading(false);
        setProgress(null);
        toast({
          title: 'Upload Failed',
          description: msg,
          variant: 'destructive',
        });
        if (event.target) {
          event.target.value = ''; // Reset file input
        }
        return;
      }

      csvParser.parseFile(file).catch((err) => {
        // Error is already handled by csvParser's error callback, but catch here for completeness
        console.error('File parsing initiation failed:', err);
      });
    },
    [csvParser, toast],
  );

  /**
   * Handles manual keyword analysis.
   */
  const handleManualAnalysis = useCallback(async () => {
    const trimmedKeywords = manualKeywords.trim();
    if (!trimmedKeywords) {
      setError('Please enter keywords to analyze.');
      toast({
        title: 'Input Required',
        description: 'Please enter keywords to analyze.',
        variant: 'warning',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null); // Use indeterminate loading for manual

    try {
      const keywords = trimmedKeywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      if (keywords.length === 0) {
        throw new Error('No valid keywords entered after trimming.');
      }

      const analysis = await fetchKeywordAnalysis(keywords); // Use batch processing internally in API client

      const prohibitedCount = analysis.filter((a) => a.isProhibited).length;
      const totalScore = analysis.reduce((sum, a) => sum + a.score, 0);
      const totalConfidence = analysis.reduce(
        (sum, a) => sum + a.confidence,
        0,
      );
      const averageScore =
        analysis.length > 0 ? totalScore / analysis.length : 0;
      const averageConfidence =
        analysis.length > 0 ? totalConfidence / analysis.length : 0;
      const suggestions = analysis
        .filter((a) => !a.isProhibited && a.score >= 70 && a.confidence >= 0.8)
        .map((a) => a.keyword);

      const newProduct: KeywordData = {
        product: `Manual Analysis (${new Date().toLocaleTimeString()})`,
        keywords,
        analysis,
        suggestions,
        prohibitedCount,
        averageScore,
        averageConfidence,
        searchVolume: undefined,
        competition: undefined,
      };

      setProducts((prev) => [...prev, newProduct]);
      setManualKeywords('');
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${keywords.length} manually entered keywords.`,
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze keywords: ${message}`);
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [manualKeywords, toast]);

  /**
   * Handles exporting the current analysis results to a CSV file.
   */
  const handleExport = useCallback(() => {
    if (products.length === 0) {
      setError('No data to export.');
      toast({
        title: 'Export Error',
        description: 'No data to export.',
        variant: 'warning',
      });
      return;
    }
    setError(null);

    // Flatten data for export
    const exportData = products.flatMap((product) =>
      product.analysis.map((analysisItem) => ({
        Product: product.product,
        Keyword: analysisItem.keyword,
        Score: analysisItem.score.toFixed(2),
        Confidence: analysisItem.confidence.toFixed(3),
        Is_Prohibited: analysisItem.isProhibited,
        Reason: analysisItem.reason ?? '',
        Match_Type: analysisItem.matchType,
        Search_Volume: product.searchVolume ?? '', // Include optional data
        Competition: product.competition ?? '', // Include optional data
        // Include calculated averages if desired
        // Avg_Product_Score: product.averageScore.toFixed(2),
        // Avg_Product_Confidence: product.averageConfidence.toFixed(3),
      })),
    );

    try {
      exportToCSV(exportData, 'keyword_analysis_export.csv');
      toast({
        title: 'Export Successful',
        description: 'Keyword analysis exported to CSV.',
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to export data: ${message}`);
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [products, toast]);

  /**
   * Clears all analysis results and resets the form.
   */
  const clearData = useCallback(() => {
    setProducts([]);
    setError(null);
    setManualKeywords('');
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All analysis results have been removed.',
      variant: 'info',
    });
  }, [toast]);

  // --- Render ---
  return (
    <div className="space-y-6">
      <KeywordAnalyzerInfoBox />

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CsvUploadSection
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          fileInputRef={fileInputRef}
        />
        <ManualAnalysisSection
          manualKeywords={manualKeywords}
          onKeywordsChange={setManualKeywords}
          onAnalyze={handleManualAnalysis}
          isLoading={isLoading}
        />
      </div>

      <ActionButtons
        onExport={handleExport}
        onClear={clearData}
        isLoading={isLoading}
        hasData={products.length > 0}
      />

      <ErrorDisplay error={error} onErrorDismiss={() => setError(null)} />

      <LoadingIndicator isLoading={isLoading} progress={progress} />

      {/* Results Section */}
      {products.length > 0 && !isLoading && (
        <AnalysisResults products={products} />
      )}
    </div>
  );
}
