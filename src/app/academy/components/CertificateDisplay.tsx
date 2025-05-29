'use client';

import React from 'react';
import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CertificateDisplayProps {
  userName: string;
  courseName: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  content: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  date: {
    fontSize: 12,
    marginTop: 40,
    textAlign: 'center',
  },
});

const CertificatePDF = ({ userName, courseName }: CertificateDisplayProps) => (
  <PDFDocument>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Certificate of Completion</Text>
        <Text style={styles.subtitle}>This is to certify that</Text>
        <Text style={styles.content}>{userName}</Text>
        <Text style={styles.content}>has successfully completed</Text>
        <Text style={styles.content}>{courseName}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </PDFDocument>
);

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
