import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ParsedFileData,
  InventoryData,
  InventoryHealthStatus,
} from '@/types/amazon-tools';

interface InventoryManagementProps {
  parsedData: ParsedFileData<InventoryData>[];
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({
  parsedData,
}) => {
  const [prediction, setPrediction] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [restockRecommendations, setRestockRecommendations] = React.useState<
    { productId: string; quantityToOrder: number; reason: string }[]
  >([]);
  const [inventoryHealthSummary, setInventoryHealthSummary] = React.useState<{
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  } | null>(null);

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

  React.useEffect(() => {
    if (parsedData.length > 0) {
      const allInventoryItems = parsedData.flatMap((fileData) => fileData.data);
      const recommendations = allInventoryItems
        .map((item) => {
          const daysOfSupply = item.currentInventory / item.averageDailySales;
          const reorderPoint =
            item.averageDailySales * (item.leadTime ?? 0) + item.safetyStock;
          const quantityToOrder = Math.max(
            0,
            reorderPoint - item.currentInventory,
          );

          let reason = '';
          if (quantityToOrder > 0) {
            reason = `Below reorder point (${reorderPoint.toFixed(2)} units).`;
          } else if (daysOfSupply < 7 && item.averageDailySales > 0) {
            reason = `Low days of supply (${daysOfSupply.toFixed(1)} days).`;
          } else {
            reason = 'Inventory levels are healthy.';
          }

          return {
            productId: item.productId,
            quantityToOrder: Math.ceil(quantityToOrder),
            reason,
          };
        })
        .filter((rec) => rec.quantityToOrder > 0); // Only show items that need restocking

      setRestockRecommendations(recommendations);

      // Calculate Inventory Health Summary
      const totalProducts = allInventoryItems.length;
      const inStock = allInventoryItems.filter(
        (item) =>
          item.currentInventory > 0 &&
          (item.status === InventoryHealthStatus.HEALTHY ||
            item.status === InventoryHealthStatus.LOW),
      ).length;
      const outOfStock = allInventoryItems.filter(
        (item) =>
          item.currentInventory === 0 ||
          item.status === InventoryHealthStatus.CRITICAL,
      ).length;
      const lowStock = allInventoryItems.filter(
        (item) =>
          item.currentInventory > 0 &&
          item.currentInventory <= item.safetyStock &&
          item.status === InventoryHealthStatus.LOW,
      ).length;

      setInventoryHealthSummary({
        totalProducts,
        inStock,
        lowStock,
        outOfStock,
      });
    } else {
      setRestockRecommendations([]);
      setInventoryHealthSummary(null);
    }
  }, [parsedData]);

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

      {/* Restock Recommendations Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Restock Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {restockRecommendations.length > 0 ? (
            <div className="space-y-3">
              {restockRecommendations.map((rec) => (
                <div
                  key={rec.productId}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div>
                    <p className="font-semibold">{rec.productId}</p>
                    <p className="text-sm text-muted-foreground">
                      Reason: {rec.reason}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    Order: {rec.quantityToOrder} units
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No restock recommendations at this time. All inventory levels
              appear healthy based on current data.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Inventory Health Summary Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Inventory Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryHealthSummary ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl font-bold">
                  {inventoryHealthSummary.totalProducts}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-xl font-bold text-green-600">
                  {inventoryHealthSummary.inStock}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600">
                  {inventoryHealthSummary.lowStock}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">
                  {inventoryHealthSummary.outOfStock}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Upload inventory data to view a summary of your inventory health.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;
