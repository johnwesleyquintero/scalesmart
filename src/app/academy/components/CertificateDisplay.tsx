'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Dynamically import PDFDownloadLink to ensure it's only rendered on the client-side
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false, // Disable server-side rendering for this component
  },
);

// --- Configuration & Theming ---

// It's good practice to register fonts if you are using custom ones or ensuring specific fallbacks.
// Times-Roman is a standard PDF font, so explicit registration might not always be needed,
// but it's good for clarity if you expand font usage.
// Font.register({ family: 'Times-Roman', src: 'path-to-times-roman.ttf' }); // Example if needed

const certificateTheme = {
  colors: {
    textDark: '#333333',
    textMedium: '#555555',
    textLight: '#777777',
    primary: '#9d6b9d', // Primary purple
    secondary: '#D8BFD8', // Lighter shade of purple
    sealBackground: '#F5F0F5', // Very light purple for seal
    pageBackground: '#ffffff',
    borderColorLight: '#E0E0E0',
  },
  fonts: {
    formal: 'Times-Roman', // Standard PDF font
    // Add other font families if needed, e.g., 'Helvetica'
  },
  // You can add common sizes or spacing units here if desired
};

// --- Styles for the PDF Document ---
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: certificateTheme.colors.pageBackground,
    padding: 20,
    borderStyle: 'solid',
    borderWidth: 10, // Outer border thickness
    borderColor: certificateTheme.colors.primary, // Outer border color
  },
  pageContentWrapper: {
    flex: 1,
    borderStyle: 'solid',
    borderWidth: 2, // Inner border thickness
    borderColor: certificateTheme.colors.secondary, // Lighter shade for inner border
    padding: 25,
    alignItems: 'center', // Center content horizontally
  },
  mainContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: certificateTheme.colors.textDark,
    fontFamily: certificateTheme.fonts.formal,
    textTransform: 'uppercase',
  },
  decorativeLine: {
    width: '80%',
    height: 1.5,
    backgroundColor: certificateTheme.colors.primary,
    marginVertical: 15,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: certificateTheme.fonts.formal,
    fontStyle: 'italic',
    color: certificateTheme.colors.textMedium,
    marginBottom: 20,
  },
  name: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 10,
    color: certificateTheme.colors.primary,
    fontFamily: certificateTheme.fonts.formal,
    textTransform: 'uppercase',
  },
  completionText: {
    fontSize: 15,
    fontFamily: certificateTheme.fonts.formal,
    color: certificateTheme.colors.textMedium,
    marginVertical: 8,
    paddingHorizontal: 20, // Add some padding if text gets too wide
  },
  course: {
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 10,
    color: certificateTheme.colors.textDark,
    fontFamily: certificateTheme.fonts.formal,
    paddingHorizontal: 10, // Prevent very long course names from touching edges
  },
  dateText: {
    fontSize: 15,
    fontFamily: certificateTheme.fonts.formal,
    color: certificateTheme.colors.textMedium,
    marginTop: 15,
    marginBottom: 20,
  },
  sealPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: certificateTheme.colors.sealBackground,
    borderWidth: 2,
    borderColor: certificateTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  sealText: {
    fontSize: 9,
    color: certificateTheme.colors.primary,
    fontFamily: certificateTheme.fonts.formal,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
  signatureBlock: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1.5,
    borderTopColor: certificateTheme.colors.textDark,
    paddingTop: 6,
    width: '100%', // Line spans the width of the block
    // Text properties for the invisible text that forces height, if any.
    // Or, make this a <View> with border if no text is desired.
    fontSize: 1, // Make placeholder text tiny if using <Text>
    color: 'transparent', // Make placeholder text invisible
  },
  signatureName: {
    fontSize: 11,
    color: certificateTheme.colors.textDark,
    fontFamily: certificateTheme.fonts.formal,
    marginTop: 3, // Space between line and name
    marginBottom: 1,
  },
  signatureTitle: {
    fontSize: 9,
    color: certificateTheme.colors.textLight,
    fontFamily: certificateTheme.fonts.formal,
  },
  signatureDateLabel: {
    // For the "Date of Issue" label
    fontSize: 11,
    color: certificateTheme.colors.textDark,
    fontFamily: certificateTheme.fonts.formal,
    marginTop: 3, // Aligns with signatureName
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: certificateTheme.colors.borderColorLight,
    fontSize: 9,
    color: certificateTheme.colors.textLight,
    paddingHorizontal: 10,
    fontFamily: certificateTheme.fonts.formal,
  },
});

// --- Component Props Interfaces ---

interface CertificatePDFProps {
  userName: string;
  courseName: string;
  courseCompletionDate: Date; // Date object for easier formatting
  certificateId: string;
  instructorName: string;
  instructorTitle: string;
  issuingOrganizationName: string;
  issueDate: Date; // Date object for easier formatting
}

// Props for the main display component, accepting string dates for flexibility from parent
interface CertificateDisplayProps {
  userName: string;
  courseName: string;
  courseCompletionDate: string; // ISO string or other parsable date string
  certificateId: string;
  instructorName: string;
  instructorTitle: string;
  issuingOrganizationName?: string; // Optional, with a default
  issueDate?: string; // Optional ISO string, defaults to now
}

// --- PDF Document Component ---

const CertificatePDF: React.FC<CertificatePDFProps> = ({
  userName,
  courseName,
  courseCompletionDate,
  certificateId,
  instructorName,
  instructorTitle,
  issuingOrganizationName,
  issueDate,
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <PDFDocument
      title={`${courseName} Certificate - ${userName}`}
      author={issuingOrganizationName}
      subject={`Certificate of Achievement for ${courseName}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContentWrapper}>
          {/* Main content of the certificate */}
          <View style={styles.mainContent}>
            <Text style={styles.title}>Certificate of Achievement</Text>
            <View style={styles.decorativeLine} />
            <Text style={styles.subtitle}>This proudly certifies that</Text>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.completionText}>
              has successfully completed the course
            </Text>
            <Text style={styles.course}>{courseName}</Text>
            <Text style={styles.dateText}>
              on {formatDate(courseCompletionDate)}
            </Text>
            <View style={styles.sealPlaceholder}>
              <Text style={styles.sealText}>
                {issuingOrganizationName.toUpperCase()}
              </Text>
              <Text style={styles.sealText}>OFFICIAL SEAL</Text>
            </View>
          </View>

          {/* Signature section */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureName}>{instructorName}</Text>
              <Text style={styles.signatureTitle}>{instructorTitle}</Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureDateLabel}>Date of Issue</Text>
              <Text style={styles.signatureTitle}>{formatDate(issueDate)}</Text>
            </View>
          </View>

          {/* Footer section */}
          <View style={styles.footer}>
            <Text>Certificate ID: {certificateId}</Text>
            <Text>Issued by {issuingOrganizationName}</Text>
          </View>
        </View>
      </Page>
    </PDFDocument>
  );
};

// --- Main Display Component ---

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  userName,
  courseName,
  courseCompletionDate: courseCompletionDateString,
  certificateId,
  instructorName,
  instructorTitle,
  issuingOrganizationName = 'ScaleSmart Academy', // Default value
  issueDate: issueDateString,
}) => {
  // Convert date strings to Date objects. Handle potential invalid date strings.
  const courseCompletionDate = new Date(courseCompletionDateString);
  const issueDate = issueDateString ? new Date(issueDateString) : new Date(); // Default to now if not provided

  // Basic validation for dates
  if (isNaN(courseCompletionDate.getTime())) {
    console.error(
      'Invalid courseCompletionDate provided:',
      courseCompletionDateString,
    );
    // Optionally render an error message or fallback UI
    return (
      <Card>
        <CardContent>
          <p>Error: Invalid course completion date.</p>
        </CardContent>
      </Card>
    );
  }
  if (isNaN(issueDate.getTime())) {
    console.error('Invalid issueDate provided:', issueDateString);
    // Defaulting to now has already happened, but good to be aware
  }

  const certificateProps: CertificatePDFProps = {
    userName,
    courseName,
    courseCompletionDate,
    certificateId,
    instructorName,
    instructorTitle,
    issuingOrganizationName,
    issueDate,
  };

  return (
    <div className="space-y-4">
      {/* Certificate Preview Card */}
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Certificate Preview</h2>
          <p className="text-lg mb-1">
            This is a preview of the certificate for:
          </p>
          <p className="text-xl font-semibold text-purple-700">{userName}</p>
          <p className="text-md mt-2">
            Course: <span className="font-medium">{courseName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Completed on: {courseCompletionDate.toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            Certificate ID: {certificateId}
          </p>
        </CardContent>
      </Card>

      {/* PDF Download Link */}
      {/* Check if PDFDownloadLink is available (client-side) before rendering */}
      {typeof window !== 'undefined' && PDFDownloadLink && (
        <PDFDownloadLink
          // Key ensures re-creation of PDF if essential props change
          key={`${userName}-${courseName}-${certificateId}-${courseCompletionDate.toISOString()}-${issueDate.toISOString()}`}
          document={<CertificatePDF {...certificateProps} />}
          fileName={`${userName.replace(/\s+/g, '_')}-${courseName.replace(/\s+/g, '-')}-certificate.pdf`}
          className="block text-center"
        >
          {({ loading, error, url }) => {
            if (error) {
              console.error('Error generating PDF:', error);
              return (
                <Button disabled className="w-full md:w-auto">
                  Error Generating PDF
                </Button>
              );
            }
            return (
              <Button
                disabled={loading}
                className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? 'Preparing Download...' : 'Download Certificate PDF'}
              </Button>
            );
          }}
        </PDFDownloadLink>
      )}
    </div>
  );
};

export default CertificateDisplay;
