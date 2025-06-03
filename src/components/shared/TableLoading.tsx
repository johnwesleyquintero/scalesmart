import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

const TableLoading: React.FC<TableLoadingProps> = ({
  rows = 5,
  columns = 3,
}) => {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200"
        >
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <div key={columnIndex} className="h-6">
              <Skeleton />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableLoading;
