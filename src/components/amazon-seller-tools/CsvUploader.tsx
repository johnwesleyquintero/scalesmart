'use client';

import DragDropArea from '@/components/ui/DragDropArea';
import { Button } from '@/components/ui/button';
import { validateCsvContent } from '@/lib/input-validation';
import { FileText, Info, Loader2 } from 'lucide-react'; // Added Loader2
import Papa from 'papaparse';
import { useCallback, useRef } from 'react'; // Added React, useRef
import { useDropzone } from 'react-dropzone';
import SampleCsvButton from './sample-csv-button';

// --- Helper Functions (Moved Outside Component) ---

/**
 * Validates the file type and size.
 * @returns Error message string or null if valid.
 */
const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number,
): string | null => {
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!allowedTypes.includes(fileExtension)) {
    return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
  }
  if (file.size > maxSize) {
    return `File size exceeds ${maxSize / 1024 / 1024}MB limit`;
  }
  return null;
};

/**
 * Reads file content as text using FileReader, wrapped in a Promise.
 * Includes basic content validation.
 */
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        // Basic security check on content before resolving
        const contentLines = content.split('\n');
        const contentValidation = validateCsvContent(contentLines);
        if (contentValidation.errors.length > 0) {
          reject(new Error(contentValidation.errors.join(', ')));
        } else {
          resolve(content);
        }
      } else {
        reject(new Error('Failed to read file content as string.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsText(file);
  });
};

/**
 * Validates CSV headers against required columns.
 * @returns Array of missing column names.
 */
const validateHeaders = (
  headers: string[],
  requiredColumns: string[],
): string[] => {
  const lowerCaseHeaders = headers.map((h) => h.toLowerCase());
  return requiredColumns.filter(
    (col) => !lowerCaseHeaders.includes(col.toLowerCase()),
  );
};

/**
 * Processes a single row using the provided validation function.
 */
const processRow = <T extends Record<string, unknown>>(
  row: Record<string, unknown>,
  index: number,
  validateRowFn?: (row: Record<string, unknown>) => T | null,
): { validRow: T | null; error: string | null } => {
  // If no validation function, treat as valid but return null data (or adjust as needed)
  if (!validateRowFn) {
    // Assuming T allows for any record if no validation
    return { validRow: row as T, error: null };
  }
  try {
    const validRow = validateRowFn(row);
    // If validation returns null, it's considered an invalid row based on criteria
    return {
      validRow,
      error: validRow
        ? null
        : `Row ${index + 1}: Invalid data format or content`,
    };
  } catch (error) {
    // Catch errors thrown *by* the validation function
    return {
      validRow: null,
      error: `Row ${index + 1}: Validation Error - ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Parses CSV data using PapaParse, validates headers, and processes rows.
 * Wrapped in a Promise.
 */
const parseAndValidateCsv = <T extends Record<string, unknown>>(
  csvData: string,
  requiredColumns: string[],
  validateRowFn?: (row: Record<string, unknown>) => T | null,
): Promise<{ validRows: T[]; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const missingColumns = validateHeaders(headers, requiredColumns);

        if (missingColumns.length > 0) {
          return reject(
            new Error(`Missing required columns: ${missingColumns.join(', ')}`),
          );
        }

        const validRows: T[] = [];
        const errors: string[] = [];

        results.data.forEach((value: unknown, index: number) => {
          const row = value as Record<string, unknown>;
          const { validRow, error } = processRow(row, index, validateRowFn);
          if (validRow) {
            validRows.push(validRow);
          }
          // Collect errors even if some rows are valid
          if (error) {
            errors.push(error);
          }
        });

        resolve({ validRows, errors });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

// --- Component ---

interface CsvUploaderProps<T extends Record<string, unknown>> {
  onUploadSuccess: (data: T[]) => void;
  onUploadError?: (error: string | undefined) => void; // Allow undefined to clear error
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  validateRow?: (row: Record<string, unknown>) => T | null;
  requiredColumns?: string[];
  // Added props for controlling state from parent if needed (optional)
  isLoading?: boolean;
  hasData?: boolean;
  onClear?: () => void; // Callback for when clear is clicked
}

export const CsvUploader = <T extends Record<string, unknown>>({
  onUploadSuccess,
  onUploadError,
  allowedFileTypes = ['.csv'],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  validateRow,
  requiredColumns = ['id', 'impressions', 'clicks'],
  isLoading: externalIsLoading, // Use props if provided
  hasData: externalHasData,
  onClear: externalOnClear,
}: CsvUploaderProps<T>) => {
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const handleFileValidation = useCallback(
    async (file: File) => {
      const fileError = validateFile(file, allowedFileTypes, maxFileSize);
      if (fileError) throw new Error(fileError);
    },
    [allowedFileTypes, maxFileSize],
  );

  const handleFileRead = useCallback(async (file: File) => {
    return await readFileContent(file);
  }, []);

  const handleCsvProcessing = useCallback(
    async (csvContent: string) => {
      return await parseAndValidateCsv<T>(
        csvContent,
        requiredColumns,
        validateRow,
      );
    },
    [requiredColumns, validateRow],
  );

  const handleUploadResults = useCallback(
    (validRows: T[], errors: string[]) => {
      if (validRows.length === 0) {
        throw new Error('No valid data found in CSV file');
      }
      onUploadSuccess(validRows);
      if (errors.length > 0) {
        console.warn('CSV validation warnings:', errors);
      }
    },
    [onUploadSuccess],
  );

  const handleProcessingError = useCallback(
    (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      onUploadError?.(errorMessage);
      console.error('CSV processing error:', error);
    },
    [onUploadError],
  );

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      try {
        onUploadError?.(undefined);
        handleFileValidation(file);
        const csvContent = await handleFileRead(file);
        const { validRows, errors } = await handleCsvProcessing(csvContent);
        handleUploadResults(validRows, errors);
      } catch (error) {
        handleProcessingError(error);
      } finally {
        resetFileInput();
      }
    },
    [
      handleCsvProcessing,
      handleFileValidation,
      handleFileRead,
      handleProcessingError,
      handleUploadResults,
      resetFileInput,
      onUploadError,
    ],
  );
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      } else {
        // Handle rejected files (e.g., wrong type, too large) - react-dropzone might provide details
        onUploadError?.('File rejected. Check type or size.');
      }
    },
    [processFile, onUploadError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': allowedFileTypes, // Use allowedFileTypes prop
    },
    maxSize: maxFileSize,
    multiple: false,
    disabled: externalIsLoading ?? false,
  });

  const handleClear = useCallback(() => {
    onUploadError?.(undefined); // Clear errors
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the actual file input
    }
    // Call external clear handler if provided
    externalOnClear?.();
  }, [externalOnClear, onUploadError]);

  return (
    <div className="flex flex-col gap-4">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Required columns (case-insensitive):{' '}
            {requiredColumns.map((col) => (
              <code
                key={col}
                className="mx-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs"
              >
                {col}
              </code>
            ))}
          </p>
          <p>Max file size: {maxFileSize / 1024 / 1024}MB</p>
        </div>
      </div>

      {/* Dropzone Area */}
      <div {...getRootProps()}>
        {/* Pass ref to the hidden input */}
        <input
          {...getInputProps()}
          ref={fileInputRef}
          disabled={externalIsLoading ?? false}
        />
        <DragDropArea isDragActive={isDragActive}>
          {(externalIsLoading ?? false) ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-primary">
                Processing...
              </span>
            </>
          ) : (
            <>
              <FileText className="mb-2 h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium">
                {isDragActive
                  ? 'Drop the CSV file here...'
                  : 'Click or drag CSV file to upload'}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Drag &apos;n&apos; drop, or click to select file
              </p>
            </>
          )}
        </DragDropArea>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <SampleCsvButton
          // Consider making dataType and fileName props of CsvUploader if they vary
          dataType="ppc"
          fileName="sample-data.csv"
          className="w-full sm:w-auto"
          variant="secondary"
        />
        {externalHasData && (
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={externalIsLoading ?? false}
            className="w-full sm:w-auto"
          >
            Clear Data
          </Button>
        )}
      </div>
    </div>
  );
};

export default CsvUploader;

// Removed unused code and ensured proper handling of exceptions
