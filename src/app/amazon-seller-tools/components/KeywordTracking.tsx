import React, { useState } from 'react';
import { ParsedFileData, KeywordTrackingData } from '@/types/amazon-tools';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KeywordTrackingResult extends KeywordTrackingData {
  id: number; // Add an ID for keying in lists
}

interface KeywordTrackingProps {
  /**
   * Data parsed from an uploaded file.
   * Currently not used in the basic tracking logic but available.
   */
  parsedData: ParsedFileData<KeywordTrackingData>[];
}

const KeywordTracking: React.FC<KeywordTrackingProps> = ({ parsedData }) => {
  const [keyword, setKeyword] = useState('');
  // State to hold the results of the keyword tracking
  const [trackingResults, setTrackingResults] = useState<
    KeywordTrackingResult[]
  >([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrackKeyword = () => {
    if (!keyword) {
      setTrackingResults([]);
      return;
    }

    const lowerCaseKeyword = keyword.toLowerCase();
    const filteredResults: KeywordTrackingResult[] = [];

    parsedData.forEach((file) => {
      file.data.forEach((item, index) => {
        // Assuming 'keyword' field exists in KeywordTrackingData
        if (item.keyword?.toLowerCase().includes(lowerCaseKeyword)) {
          // Added optional chaining
          filteredResults.push({
            id: filteredResults.length + 1, // Simple unique ID
            keyword: item.keyword,
            rank: item.rank,
            searchVolume: item.searchVolume,
            competition: item.competition, // Include new fields
            cpc: item.cpc, // Include new fields
          });
        }
      });
    });

    setTrackingResults(filteredResults);
    console.log(
      `Keyword tracking complete for "${keyword}". Found ${filteredResults.length} results.`,
    );
  };

  const handleGetKeywordRecommendations = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      // Extract all keyword tracking data from all uploaded files
      const allKeywordData: KeywordTrackingData[] = parsedData.flatMap(
        (file) => file.data,
      );

      if (allKeywordData.length === 0) {
        setError(
          'No keyword tracking data uploaded or processed yet. Please upload relevant data first.',
        );
        setLoading(false);
        return;
      }

      // Call the AI recommendation API route
      const response = await fetch(
        '/api/amazon-tools/keyword-recommendations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keywordData: allKeywordData }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to fetch keyword recommendations from API',
        );
      }

      const data = await response.json();
      setRecommendation(data.recommendation); // Assuming the API returns 'recommendation'
    } catch (err) {
      setError(
        `Failed to get keyword recommendations: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Keyword Tracking</h2>
      <p className="text-muted-foreground dark:text-gray-400">
        Track keyword rankings and search volume on Amazon.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
        <div className="grid flex-grow w-full sm:w-auto gap-1.5">
          <Label htmlFor="keyword-input">Keyword to Track</Label>
          <Input
            id="keyword-input"
            type="text"
            placeholder="Enter keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            // Allow pressing Enter to trigger tracking
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleTrackKeyword();
              }
            }}
          />
        </div>
        <Button
          onClick={handleTrackKeyword}
          disabled={!keyword}
          className="w-full sm:w-auto"
        >
          Track Keyword
        </Button>
      </div>

      {/* Display tracking results if available */}
      {trackingResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tracking Results</h3>
          {trackingResults.map((result) => (
            <Card key={result.id}>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">
                  {result.keyword || 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-muted-foreground dark:text-gray-400">
                <p>Rank: {result.rank || 'N/A'}</p>
                <p>Search Volume: {result.searchVolume || 'N/A'}</p>
                <p>Competition: {result.competition || 'N/A'}</p>{' '}
                {/* Display new field */}
                <p>CPC: {result.cpc?.toFixed(2) || 'N/A'}</p>{' '}
                {/* Display new field */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Recommendation Section */}
      <div className="mt-8 p-4 border rounded">
        <h3 className="text-xl font-semibold mb-4">
          Intelligent Keyword Recommendations
        </h3>
        <Button
          onClick={handleGetKeywordRecommendations}
          disabled={loading || parsedData.length === 0} // Disable if loading or no data
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Generating Recommendations...' : 'Get AI Recommendations'}
        </Button>
        {recommendation && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-foreground whitespace-pre-wrap">
            {recommendation}
          </div>
        )}
        {error && <p className="mt-4 text-red-600">Error: {error}</p>}
      </div>

      {/* Optionally display a message if no results */}
      {/* {keyword && trackingResults.length === 0 && (
           <p className="text-muted-foreground dark:text-gray-400 italic">No results found for "{keyword}".</p>
         )} */}
    </div>
  );
};

export default KeywordTracking;
