import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsedFileData, InventoryData } from '@/types/amazon-tools';

interface InventoryManagementProps {
  parsedData: ParsedFileData<InventoryData>[];
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({
  parsedData,
}) => {
  const [prediction, setPrediction] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGetPrediction = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      // Flatten the parsed data array for the API call
      const inventoryData = parsedData.flatMap((fileData) => fileData.data);

      if (inventoryData.length === 0) {
        setError('No inventory data available for prediction.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/amazon-tools/predictive-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventoryData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            'Failed to fetch predictive inventory analysis from API',
        );
      }

      const data = await response.json();
      setPrediction(data.prediction); // Assuming the API returns 'prediction'
    } catch (err) {
      setError(
        `Failed to get predictive inventory analysis: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">
        Automated Inventory & Restock Management
      </h2>
      <p className="text-muted-foreground dark:text-gray-400">
        Manage your inventory levels and get automated restock recommendations.
      </p>

      {parsedData.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            Uploaded Inventory Data
          </h3>
          {/* Display parsed inventory data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parsedData.map((fileData) =>
              fileData.data.map((item, index) => (
                <Card key={`inventory-${fileData.fileName}-${index}`}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{item.productId}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p>Current Inventory: {item.currentInventory}</p>
                    <p>
                      Average Daily Sales: {item.averageDailySales.toFixed(2)}
                    </p>
                    {item.salesLast30Days !== undefined && (
                      <p>Sales Last 30 Days: {item.salesLast30Days}</p>
                    )}
                    {item.leadTime !== undefined && (
                      <p>Lead Time: {item.leadTime} days</p>
                    )}
                    <p>Safety Stock: {item.safetyStock}</p>
                    <p>Status: {item.status}</p>
                    {/* Add more details as needed */}
                  </CardContent>
                </Card>
              )),
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 border rounded-md text-center text-muted-foreground dark:text-gray-400">
          Upload inventory data via the Data Source tab to view details and
          recommendations.
        </div>
      )}

      <div className="mt-8 p-4 border rounded">
        <h3 className="text-xl font-semibold mb-4">Predictive Analysis</h3>
        <button
          onClick={handleGetPrediction}
          disabled={loading || parsedData.length === 0} // Disable if loading or no data
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Analyzing Inventory...' : 'Get Predictive Analysis'}
        </button>
        {prediction && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-foreground whitespace-pre-wrap">
            {prediction}
          </div>
        )}
        {error && <p className="mt-4 text-red-600">Error: {error}</p>}
      </div>

      {/* TODO: Add section for Restock Recommendations */}
      {/* TODO: Add section for Inventory Health Summary */}
    </div>
  );
};

export default InventoryManagement;
