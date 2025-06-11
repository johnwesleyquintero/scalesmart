import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsedFileData, InventoryData } from '@/types/amazon-tools';

interface InventoryManagementProps {
  parsedData: ParsedFileData<InventoryData>[];
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({
  parsedData,
}) => {
  // TODO: Implement state and logic for inventory management
  // This will involve fetching real-time inventory data via SP-API,
  // calculating sales velocity, lead times, safety stock, and restock recommendations.

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">
        Automated Inventory & Restock Management
      </h2>
      <p className="text-muted-foreground dark:text-gray-400">
        Manage your inventory levels and get automated restock recommendations.
      </p>

      {/* TODO: Add UI elements for displaying inventory data, recommendations, and settings */}
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

      {/* TODO: Add section for Restock Recommendations */}
      {/* TODO: Add section for Inventory Health Summary */}
    </div>
  );
};

export default InventoryManagement;
