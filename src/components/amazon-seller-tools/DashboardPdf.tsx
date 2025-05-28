import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  tableContainer: {
    marginTop: 10,
  },
  table: {
    width: 'auto', // Use 'auto' to allow table to fit content or be explicitly sized
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#bfbfbf',
    alignItems: 'center', // Align items in row
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold', // React PDF uses string for fontWeight
  },
  tableCell: {
    padding: 6, // Consistent padding
    borderRightWidth: 1,
    borderColor: '#000',
  },
  tableCellHeader: {
    padding: 6, // Consistent padding
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold', // React PDF uses string for fontWeight
  },
  tableCellContent: {
    padding: 6, // Consistent padding
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  smallText: {
    fontSize: 8, // Smaller font for cell content
  },
});

interface DashboardPdfProps {
  title: string;
  content: string; // Assuming content is a JSON string of DashboardMetrics[]
}
const DashboardPdf: React.FC<DashboardPdfProps> = ({ title, content }) => {
  try {
    const metrics: DashboardMetrics[] = JSON.parse(content);

    // Define which headers to display and their display names
    // This provides more control over the output and readability
    const displayHeadersConfig: {
      key: keyof DashboardMetrics;
      label: string;
      width?: string;
    }[] = [
      { key: 'date', label: 'Date', width: '15%' },
      { key: 'unique_identifier', label: 'ASIN', width: '20%' },
      { key: 'total_sales', label: 'Sales', width: '10%' },
      { key: 'total_orders', label: 'Orders', width: '10%' },
      { key: 'acos', label: 'ACoS (%)', width: '10%' },
      { key: 'roas', label: 'RoAS', width: '10%' },
      { key: 'ad_spend', label: 'Ad Spend', width: '12.5%' },
      { key: 'ad_sales', label: 'Ad Sales', width: '12.5%' },
      // Add more headers as needed
    ];

    if (!metrics || metrics.length === 0) {
      return (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.section}>
              <Text style={styles.title}>{title}</Text>
              <Text>No data available to display.</Text>
            </View>
          </Page>
        </Document>
      );
    }

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]} fixed>
                {displayHeadersConfig.map((headerConfig) => (
                  <View
                    key={headerConfig.key}
                    style={[
                      styles.tableCellHeader,
                      { width: headerConfig.width || 'auto' },
                    ]}
                  >
                    <Text style={styles.smallText}>{headerConfig.label}</Text>
                  </View>
                ))}
              </View>
              {/* Table Body */}
              {metrics.map((metric, index) => (
                <View key={index} style={styles.tableRow}>
                  {displayHeadersConfig.map((headerConfig) => {
                    let cellValue = metric[headerConfig.key];
                    // Format numbers to 2 decimal places if they are numbers
                    if (typeof cellValue === 'number') {
                      // ACoS and RoAS might need specific formatting
                      if (
                        headerConfig.key === 'acos' ||
                        headerConfig.key === 'roas'
                      ) {
                        cellValue = cellValue.toFixed(2);
                      } else {
                        cellValue = cellValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }
                    }
                    return (
                      <View
                        key={`${index}-${headerConfig.key}`}
                        style={[
                          styles.tableCellContent,
                          { width: headerConfig.width || 'auto' },
                        ]}
                      >
                        <Text style={styles.smallText}>
                          {String(cellValue ?? '')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </Page>
      </Document>
    );
  } catch (error) {
    console.error('Error parsing metrics data:', error);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>
            <Text>Error: Could not display data.</Text>
            <Text>{String(error)}</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export default DashboardPdf;
