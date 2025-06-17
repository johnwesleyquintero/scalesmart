'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Props for the FileDropZone component.
 */
interface FileDropZoneProps {
  /** Callback function to be called when a file is successfully accepted. */
  onFileAcceptedAction: (file: File) => void;
  /** An array of accepted file types (e.g., ['.csv', '.xlsx']). */
  acceptedFileTypes?: string[];
  /** The maximum allowed file size in bytes. */
  maxFileSize?: number;
  /** Additional CSS classes for the component. */
  className?: string;
  /** The label text displayed in the drop zone. */
  label?: string;
  /** The error message to display for invalid files. */
  errorMessage?: string;
}

/**
 * A component that provides a drag-and-drop area for file uploads.
 * It supports file type and size validation.
 * Built using react-dropzone.
 * @see https://react-dropzone.js.org/
 */
export function FileDropZone({
  onFileAcceptedAction,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className,
  label = 'Drop your file here or click to browse',
  errorMessage = 'Invalid file. Please try again.',
}: Readonly<FileDropZoneProps>) {
  const [error, setError] = useState<string | undefined>(undefined);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(undefined);
      if (acceptedFiles.length === 0) {
        setError('No file selected');
        return;
      }

      const file = acceptedFiles[0];

      if (file.size > maxFileSize) {
        setError(`File size must be less than ${maxFileSize / 1024 / 1024}MB`);
        return;
      }

      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`Accepted file types: ${acceptedFileTypes.join(', ')}`);
        return;
      }

      onFileAcceptedAction(file);
    },
    [acceptedFileTypes, maxFileSize, onFileAcceptedAction],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors',
          'hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          isDragActive && 'border-primary bg-primary/5',
          error && 'border-destructive',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload
            className={cn(
              'h-10 w-10',
              isDragActive ? 'text-primary' : 'text-gray-400',
            )}
          />
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error || errorMessage}</span>
        </div>
      )}
    </div>
  );
}
