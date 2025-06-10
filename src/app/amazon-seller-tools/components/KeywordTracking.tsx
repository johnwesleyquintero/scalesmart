import React, { useState } from 'react';
import { ParsedFileData, KeywordTrackingData } from '@/types/amazon-tools';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KeywordTrackingResult {
  id: number;
  keyword: string;
  rank: number;
  searchVolume: string; // Consider a more structured type if needed
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
        if (item.keyword.toLowerCase().includes(lowerCaseKeyword)) {
          filteredResults.push({
            id: filteredResults.length + 1, // Simple unique ID
            keyword: item.keyword,
            rank: item.rank,
            searchVolume: String(item.searchVolume), // Ensure searchVolume is string for display
          });
        }
      });
    });

    setTrackingResults(filteredResults);
    console.log(`Keyword tracking complete for "${keyword}". Found ${filteredResults.length} results.`);
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
                <CardTitle className="text-lg">{result.keyword}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Rank: {result.rank}
                </p>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Search Volume: {result.searchVolume}
                </p>
                {/* Add more tracking details here based on actual data */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Optionally display a message if no results */}
      {/* {keyword && trackingResults.length === 0 && (
         <p className="text-muted-foreground dark:text-gray-400 italic">No results found for "{keyword}".</p>
       )} */}
    </div>
  );
};

export default KeywordTracking;
