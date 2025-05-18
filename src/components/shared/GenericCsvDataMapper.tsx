// c:\\Users\\johnw\\portfolio\\src\\components\\shared\\GenericCsvDataMapper.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { CsvColumnMapping } from '@/types/data-mapping';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import styles from './GenericCsvDataMapper.module.css';

interface GenericCsvDataMapperProps {
  csvHeaders: string[];
  targetMetrics: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
    expectedType: 'string' | 'number' | 'date' | 'boolean';
    hint?: string;
  }[];
  onMappingComplete: (mapping: CsvColumnMapping) => void;
  initialMapping?: CsvColumnMapping;
  isLoading?: boolean;
  onCancel: () => void;
  sampleDataRow?: Record<string, string>; // To show sample values
  title: string;
  description: string;
}

// Define a stable empty object for the default initialMapping
const DEFAULT_INITIAL_MAPPING: CsvColumnMapping = Object.freeze({}); // Make it immutable too

const GenericCsvDataMapper: React.FC<GenericCsvDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onMappingComplete,
  initialMapping = DEFAULT_INITIAL_MAPPING, // Use the stable default
  isLoading = false,
  onCancel,
  sampleDataRow,
  title,
  description,
}) => {
  // Initialize state with a function to ensure it only runs once for initialization
  // based on the initial props.
  const [currentMapping, setCurrentMapping] = useState<CsvColumnMapping>(() => {
    const map: CsvColumnMapping = {};
    targetMetrics.forEach((field) => {
      map[field.key] = initialMapping[field.key] || null;
    });
    return map;
  });

  // This useEffect is now for synchronizing with prop changes *after* the initial mount.
  useEffect(() => {
    // Construct the new mapping based on current props
    const newMapFromProps: CsvColumnMapping = {};
    targetMetrics.forEach((field) => {
      newMapFromProps[field.key] = initialMapping[field.key] || null;
    });

    // Update state only if the new map from props is different from the current state
    setCurrentMapping((prevMapping) => {
      // Check if newMapFromProps is actually different from prevMapping
      const newKeys = Object.keys(newMapFromProps);
      const prevKeys = Object.keys(prevMapping);

      if (newKeys.length !== prevKeys.length) {
        return newMapFromProps; // Keys have changed, so update
      }

      for (const key of newKeys) {
        if (
          prevMapping[key as keyof DashboardMetrics] !==
          newMapFromProps[key as keyof DashboardMetrics]
        ) {
          return newMapFromProps; // Values have changed, so update
        }
      }

      return prevMapping; // No change, return previous state to prevent re-render
    });
  }, [targetMetrics, initialMapping]);

  const handleSelectChange = (
    targetFieldId: keyof DashboardMetrics,
    csvHeader: string,
  ) => {
    setCurrentMapping((prev) => ({
      ...prev,
      [targetFieldId]: csvHeader === 'none' ? null : csvHeader,
    }));
  };

  const handleSubmit = () => {
    for (const field of targetMetrics) {
      if (field.required && !currentMapping[field.key]) {
        alert('Please map the required field: ' + field.label);
        return;
      }
    }
    onMappingComplete(currentMapping);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading CSV headers...</div>;
  }

  if (!csvHeaders || csvHeaders.length === 0) {
    return (
      <div className={styles.noHeaders}>
        No CSV headers found. Please upload a valid CSV.
      </div>
    );
  }

  return (
    <div className={styles.mapperContainer}>
      <h3 className={styles.title}>{title}</h3>
      <p>{description}</p>
      <div className={styles.mappingTable}>
        <div className={`${styles.mappingRow} ${styles.mappingHeaderRow}`}>
          <div className={styles.targetMetricHeader}>Dashboard Field</div>
          <div className={styles.expectedTypeHeader}>Expected Type</div>
          <div className={styles.csvColumnHeader}>CSV Column to Map</div>
          <div className={styles.sampleValueHeader}>
            Sample Value (from your CSV)
          </div>
        </div>
        {targetMetrics.map((field) => (
          <div key={field.key} className={styles.mappingRow}>
            <div className={styles.targetMetricCell}>
              <Label
                htmlFor={'select-' + String(field.key)}
                className={styles.label}
              >
                {field.label}
                {field.required && <span className={styles.required}>*</span>}
              </Label>
              {field.hint && <p className={styles.hint}>{field.hint}</p>}
            </div>
            <div className={styles.expectedTypeCell}>
              <span className={styles.typeBadge}>{field.expectedType}</span>
            </div>
            <div className={styles.csvColumnCell}>
              <Select
                value={(currentMapping[field.key] as string) || 'none'}
                onValueChange={(value) => handleSelectChange(field.key, value)}
              >
                <SelectTrigger
                  id={'select-' + String(field.key)}
                  className={styles.selectTrigger}
                >
                  <SelectValue placeholder="Select CSV Column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Not Mapped --</SelectItem>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={styles.sampleValueCell}>
              {sampleDataRow &&
              currentMapping[field.key] &&
              sampleDataRow[currentMapping[field.key] as string] ? (
                <span className={styles.sampleText}>
                  {sampleDataRow[currentMapping[field.key] as string]}
                </span>
              ) : (
                <span className={styles.noSampleText}>N/A</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.actionButtons}>
        <Button onClick={handleSubmit} className={styles.submitButton}>
          Confirm Mapping
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className={styles.cancelButton}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default GenericCsvDataMapper;
