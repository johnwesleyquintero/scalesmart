import React from 'react';

interface DashboardViewerProps {
  dashboardId: string;
}

export const DashboardViewer: React.FC<DashboardViewerProps> = ({
  dashboardId,
}) => {
  // In a real application, you would fetch dashboard data based on dashboardId
  // and render the appropriate widgets.
  // In a real application, you would fetch dashboard data based on dashboardId
  // and render the appropriate widgets.
  // For large datasets, implement performance optimization strategies.
  // This is a conceptual example demonstrating where optimization would be applied.

  interface DashboardItem {
    id: number;
    name: string;
    value: number;
  }

  const [data, setData] = React.useState<DashboardItem[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  React.useEffect(() => {
    const fetchData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const dummyData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
      }));
      setData(dummyData);
    };
    fetchData();
  }, [dashboardId]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">
        Viewing Dashboard: {dashboardId}
      </h2>
<<<<<<< HEAD
      <div
        style={{ height: '400px', overflowY: 'auto' }}
        className="border rounded-md p-2 mb-4"
      >
        {paginatedData.map((item) => (
          <div key={item.id} className="border-b p-2 last:border-b-0">
            {item.name}: {item.value.toFixed(2)}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
=======
      <p>This is a placeholder for the dashboard content.</p>
      {/* Render actual dashboard widgets here based on fetched data */}
>>>>>>> parent of 8577dfa (feat(dashboard): implement widget library and responsive grid layout)
    </div>
  );
};
