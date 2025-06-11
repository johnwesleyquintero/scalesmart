import React, { useState } from 'react';
import { ParsedFileData, CompetitorMonitoringData } from '@/types/amazon-tools';
import { Input } from '@/components/ui/input';

interface CompetitorMonitoringProps {
  parsedData: ParsedFileData<CompetitorMonitoringData>[];
}

const CompetitorMonitoring: React.FC<CompetitorMonitoringProps> = ({
  parsedData,
}) => {
  const [asinInput, setAsinInput] = useState<string>('');
  const [monitoredCompetitors, setMonitoredCompetitors] = useState<
    CompetitorMonitoringData[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAsin = async () => {
    if (!asinInput.trim()) {
      setError('Please enter an ASIN.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/amazon-sp-api/competitor-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ asin: asinInput.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch competitor data.');
      }

      const data = await response.json();
      // Assuming 'data' contains the CompetitorMonitoringData structure
      // You might need to transform the SP-API response into CompetitorMonitoringData
      // For now, a simple mapping or direct use if the API returns it directly.
      const newCompetitor: CompetitorMonitoringData = {
        asin: asinInput.trim(),
        productName:
          data.summaries?.[0]?.itemClassification || 'Unknown Product', // Example mapping
        currentPrice: data.summaries?.[0]?.buyingPrice?.amount || 0, // Example mapping
        // Add other fields as per CompetitorMonitoringData interface
        // This will require careful mapping from the actual SP-API response structure
      };

      setMonitoredCompetitors((prev) => [...prev, newCompetitor]);
      setAsinInput('');
    } catch (err) {
      setError(
        `Error adding competitor: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground">
      <h3 className="text-xl font-semibold mb-4">
        Competitor Monitoring & Analysis
      </h3>
      <p className="text-muted-foreground">
        Track and analyze competitor performance, pricing, and strategies.
      </p>

      <div className="mt-4">
        <h4 className="text-lg font-medium mb-2">Add Competitor ASIN</h4>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter ASIN (e.g., B07XXXXXXX)"
            className="flex-grow"
            value={asinInput}
            onChange={(e) => setAsinInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddAsin();
              }
            }}
          />
          <button
            onClick={handleAddAsin}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add ASIN'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {(parsedData.length > 0 || monitoredCompetitors.length > 0) && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-2">Monitored Competitors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Display data from parsed files */}
            {parsedData.map((fileData) =>
              fileData.data.map((competitor, index) => (
                <div
                  key={`parsed-${fileData.fileName}-${index}`}
                  className="border p-3 rounded-md"
                >
                  <p className="font-semibold">{competitor.productName}</p>
                  <p>ASIN: {competitor.asin}</p>
                  <p>Price: ${competitor.currentPrice}</p>
                  {competitor.bsr && <p>BSR: {competitor.bsr}</p>}
                  {competitor.reviewsCount && (
                    <p>Reviews: {competitor.reviewsCount}</p>
                  )}
                  {competitor.rating && <p>Rating: {competitor.rating}</p>}
                  {/* Add more details as needed */}
                </div>
              )),
            )}
            {/* Display dynamically added competitors */}
            {monitoredCompetitors.map((competitor, index) => (
              <div key={`dynamic-${index}`} className="border p-3 rounded-md">
                <p className="font-semibold">{competitor.productName}</p>
                <p>ASIN: {competitor.asin}</p>
                <p>Price: ${competitor.currentPrice}</p>
                {competitor.bsr && <p>BSR: {competitor.bsr}</p>}
                {competitor.reviewsCount && (
                  <p>Reviews: {competitor.reviewsCount}</p>
                )}
                {competitor.rating && <p>Rating: {competitor.rating}</p>}
                {/* Add more details as needed */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorMonitoring;
