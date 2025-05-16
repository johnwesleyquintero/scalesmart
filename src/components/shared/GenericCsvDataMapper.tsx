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
    hint?: string;
  }[];
  onMappingComplete: (mapping: CsvColumnMapping) => void;
  initialMapping?: CsvColumnMapping;
  isLoading?: boolean;
  onCancel: () => void;
  title: string;
  description: string;
}

const GenericCsvDataMapper: React.FC<GenericCsvDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onMappingComplete,
  initialMapping = {},
  isLoading = false,
  onCancel,
  title,
  description,
}) => {
  const [currentMapping, setCurrentMapping] =
    useState<CsvColumnMapping>(initialMapping);

  useEffect(() => {
    const initialMap: CsvColumnMapping = {};
    targetMetrics.forEach((field) => {
      initialMap[field.key] = initialMapping[field.key] || null;
    });
    setCurrentMapping(initialMap);
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
      <div className={styles.mappingGrid}>
        {targetMetrics.map((field) => (
          <div key={field.key} className={styles.mappingRow}>
            <Label
              htmlFor={'select-' + String(field.key)}
              className={styles.label}
            >
              {field.label}
              {field.required && <span className={styles.required}>*</span>}
              {field.hint && <p className={styles.hint}>{field.hint}</p>}
            </Label>
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
        ))}
      </div>
      <Button onClick={handleSubmit} className={styles.submitButton}>
        Confirm Mapping
      </Button>
      <Button onClick={onCancel} className={styles.cancelButton}>
        Cancel
      </Button>
    </div>
  );
};

export default GenericCsvDataMapper;
