'use client';
import React, { useState } from 'react';
import { getAIDrivenRecommendation } from '@/lib/amazon-tools/gemini-api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataSourceTab from './components/DataSourceTab';
import ProductResearch from './components/ProductResearch';
import KeywordTracking from './components/KeywordTracking';
import ListingOptimization from './components/ListingOptimization';
import Analytics from './components/Analytics';
// Import the shared type definition
import {
  ParsedFileData,
  ProductResearchData,
  KeywordTrackingData,
  ListingOptimizationData,
  AnalyticsData,
} from '@/types/amazon-tools'; // Assuming this file exists and exports ParsedFileData

const AmazonSellerToolsPage: React.FC = () => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Use the imported shared type for state
  const [allParsedData, setAllParsedData] = useState<
    ParsedFileData<Record<string, unknown>>[]
  >([]);

  // Callback function to receive parsed data from DataSourceTab.
  // Assuming DataSourceTab calls this with a single file's name and its parsed data.
  const handleFileUpload = (
    files: File[],
    parsedData: Record<string, unknown>[],
  ) => {
    setAllParsedData((prevData) => {
      // Check if data for this file already exists
      const existingIndex = prevData.findIndex(
        (item) => item.fileName === files[0].name,
      );

      if (existingIndex > -1) {
        // If exists, replace the data for that file
        const newData = [...prevData];
        newData[existingIndex] = { fileName: files[0].name, data: parsedData };
        return newData;
      } else {
        // If new file, add it to the list
        return [...prevData, { fileName: files[0].name, data: parsedData }];
      }
    });
  };

  const handleGetRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      // Example prompt - potentially make this dynamic based on uploaded data
      const prompt =
        'Generate a short, catchy product title for a new eco-friendly water bottle.';
      const rec = await getAIDrivenRecommendation(prompt);
      setRecommendation(rec);
    } catch (err) {
      setError(
        `Failed to get recommendation: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold my-6 text-center text-foreground">
        Amazon Seller Tools
      </h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Tools and insights to help you succeed on the Amazon marketplace.
      </p>

      <Tabs defaultValue="product-research" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
          <TabsTrigger value="product-research">Product Research</TabsTrigger>
          <TabsTrigger value="keyword-tracking">Keyword Tracking</TabsTrigger>
          <TabsTrigger value="listing-optimization">
            Listing Optimization
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="data-source">Data Source</TabsTrigger>
        </TabsList>

        <TabsContent value="product-research" className="space-y-4 mt-4">
          {/* Pass parsed data. Ensure ProductResearch component expects ParsedFileData[] */}
          <ProductResearch parsedData={allParsedData} />
        </TabsContent>

        <TabsContent value="keyword-tracking" className="space-y-4 mt-4">
          {/* Pass parsed data. Ensure KeywordTracking component expects ParsedFileData[] */}
          <KeywordTracking parsedData={allParsedData} />
        </TabsContent>

        <TabsContent value="listing-optimization" className="space-y-4 mt-4">
          {/* Pass parsed data. Ensure ListingOptimization component expects ParsedFileData[] */}
          <ListingOptimization parsedData={allParsedData} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* Pass parsed data. Ensure Analytics component expects ParsedFileData[] */}
          <Analytics parsedData={allParsedData} />
        </TabsContent>

        <TabsContent value="data-source" className="space-y-4 mt-4">
          <h2 className="text-2xl font-semibold mb-4">Data Source</h2>
          {/* Pass the refined callback function */}
          <DataSourceTab
            currentTab="data-source"
            onFileUpload={handleFileUpload}
          />
        </TabsContent>
      </Tabs>

      {/* Example section for recommendation (can be moved/integrated elsewhere) */}
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-2xl font-semibold mb-4">AI Recommendation</h2>
        <button
          onClick={handleGetRecommendation}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Product Title Recommendation'}
        </button>
        {recommendation && (
          <p className="mt-4 text-green-600">{recommendation}</p>
        )}
        {error && <p className="mt-4 text-red-600">Error: {error}</p>}
      </div>
    </div>
  );
};

export default AmazonSellerToolsPage;

// Note: Create a file like `types/amazonSellerTools.ts` with:
// export interface ParsedFileData {
//   fileName: string;
//   data: Record<string, unknown>[]; // Or a more specific type based on expected data structure
// }
//
// Also, ensure components like ProductResearch, KeywordTracking, etc., update their props type:
// interface KeywordTrackingProps {
//   parsedData: ParsedFileData[];
// }
// const KeywordTracking: React.FC<KeywordTrackingProps> = ({ parsedData }) => { ... };
