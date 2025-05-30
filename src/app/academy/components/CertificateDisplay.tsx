'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Dynamically import PDFDownloadLink to ensure it's only rendered on the client-side
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
  },
);

interface CertificateDisplayProps {
  userName: string;
  courseName: string;
}

const TEXT_COLOR_DARK = '#333333';
const TEXT_COLOR_MEDIUM = '#555555';
const TEXT_COLOR_LIGHT = '#777777';
const PRIMARY_PURPLE = '#9d6b9d';
const FONT_FAMILY_FORMAL = 'Times-Roman'; // Define the constant

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20, // Reduced overall padding
    // Double border effect
    borderStyle: 'solid',
    borderWidth: 10, // Outer border thickness
    borderColor: PRIMARY_PURPLE, // Outer border color
  },
  pageContentWrapper: {
    flex: 1,
    borderStyle: 'solid',
    borderWidth: 2, // Inner border thickness
    borderColor: '#D8BFD8', // Lighter shade of purple for inner border
    padding: 25, // Reduced padding inside the inner border
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
    fontSize: 26, // Further reduced to prevent text breaking
    fontWeight: 'bold',
    marginBottom: 10, // Reduced margin
    color: TEXT_COLOR_DARK,
    fontFamily: FONT_FAMILY_FORMAL,
    textTransform: 'uppercase',
  },
  decorativeLine: {
    width: '80%',
    height: 1.5,
    backgroundColor: PRIMARY_PURPLE,
    marginVertical: 15, // Reduced margin
  },
  subtitle: {
    fontSize: 17, // Slightly smaller
    fontFamily: FONT_FAMILY_FORMAL,
    fontStyle: 'italic',
    color: TEXT_COLOR_MEDIUM,
    marginBottom: 20, // Reduced margin
  },
  name: {
    fontSize: 30, // Slightly smaller
    fontWeight: 'bold',
    marginVertical: 10, // Reduced margin
    color: PRIMARY_PURPLE,
    fontFamily: FONT_FAMILY_FORMAL,
    textTransform: 'uppercase',
  },
  completionText: {
    fontSize: 15, // Slightly smaller
    fontFamily: FONT_FAMILY_FORMAL,
    color: TEXT_COLOR_MEDIUM,
    marginVertical: 8, // Reduced margin
  },
  course: {
    fontSize: 26, // Slightly smaller
    fontWeight: 'bold',
    marginVertical: 10, // Reduced margin
    color: TEXT_COLOR_DARK,
    fontFamily: FONT_FAMILY_FORMAL,
  },
  dateText: {
    fontSize: 15, // Slightly smaller
    fontFamily: FONT_FAMILY_FORMAL,
    color: TEXT_COLOR_MEDIUM,
    marginTop: 15, // Reduced margin
    marginBottom: 20, // Reduced margin
  },
  sealPlaceholder: {
    width: 80, // Smaller seal
    height: 80, // Smaller seal
    borderRadius: 40, // Adjusted for new size
    backgroundColor: '#F5F0F5', // Very light purple
    border: `2px solid ${PRIMARY_PURPLE}`,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15, // Reduced margin
    marginBottom: 20, // Reduced margin
  },
  sealText: {
    fontSize: 9, // Slightly smaller
    color: PRIMARY_PURPLE,
    fontFamily: FONT_FAMILY_FORMAL,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30, // Reduced space before signatures
  },
  signatureBlock: {
    width: '45%', // Each signature takes up part of the width
    alignItems: 'center', // Center the text block
  },
  signatureLine: {
    borderTop: '1.5px solid #333333', // Thicker line for signature
    paddingTop: 6, // Reduced space
    width: '100%', // Line spans the width of the block
    textAlign: 'center',
    fontSize: 11, // Slightly smaller
    color: TEXT_COLOR_DARK,
    fontFamily: FONT_FAMILY_FORMAL,
    marginBottom: 3, // Reduced space
  },
  signatureLabel: {
    fontSize: 9, // Slightly smaller
    color: TEXT_COLOR_LIGHT, // Lighter text for "Instructor", "Date"
    fontFamily: FONT_FAMILY_FORMAL,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30, // Reduced space before footer
    paddingTop: 10, // Reduced padding
    borderTop: '1px solid #E0E0E0', // Light separator line
    fontSize: 9, // Slightly smaller
    color: TEXT_COLOR_LIGHT,
    paddingHorizontal: 10,
  },
});

const CertificatePDF = ({ userName, courseName }: CertificateDisplayProps) => {
  const completionDate = new Date();
  const certificateId = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase(); // Simple unique ID

  return (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContentWrapper}>
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
              on{' '}
              {completionDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.sealPlaceholder}>
              <Text style={styles.sealText}>SCALESMART ACADEMY</Text>
              <Text style={styles.sealText}>OFFICIAL</Text>
            </View>
          </View>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLine}> </Text>{' '}
              {/* This makes the line blank */}
              <Text style={styles.signatureLabel}>
                John Wesley Quintero, LPT
              </Text>{' '}
              {/* Name below the line */}
              <Text style={styles.signatureLabel}>Lead Instructor</Text>{' '}
              {/* Title below the name */}
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLine}> </Text>{' '}
              {/* Keep the line, but make the text blank */}
              <Text style={styles.signatureLabel}>Date of Issue</Text>
            </View>
          </View>
          <View style={styles.footer}>
            <Text>Certificate ID: {certificateId}</Text>
            <Text>Issued by ScaleSmart Academy</Text>
          </View>
        </View>
      </Page>
    </PDFDocument>
  );
};

const CertificateDisplay = ({
  userName,
  courseName,
}: CertificateDisplayProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Certificate Preview</h2>
          <p className="text-lg mb-2">
            Certificate of Completion for {userName}
          </p>
          <p className="text-lg">{courseName}</p>
        </CardContent>
      </Card>

      <PDFDownloadLink
        key={`${userName}-${courseName}`} // Force re-render if userName or courseName changes
        document={
          <CertificatePDF userName={userName} courseName={courseName} />
        }
        fileName={`${courseName.replace(/\s+/g, '-')}-certificate.pdf`}
        className="block text-center"
      >
        {({ loading, error }) => (
          <Button disabled={loading || !!error} className="w-full md:w-auto">
            {loading ? 'Preparing Download...' : 'Download Certificate'}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default CertificateDisplay;
