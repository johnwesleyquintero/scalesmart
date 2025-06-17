# Data Table

A component for displaying tabular data with features like filtering, sorting, pagination, and column visibility. It is built using `@tanstack/react-table`.

## Usage

Use the `DataTable` component to present collections of data in a structured table format. You need to provide the data and define the columns.

```jsx
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

// Define your data type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Define your columns
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  // Add more columns as needed
];

// Example data
const data: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'User' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Admin' },
  // Add more data
];

function MyDataTableExample() {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
```

## Props

- `columns`: `ColumnDef<TData, TValue>[]` (required) - An array defining the table columns and how to access data for each column. Refer to `@tanstack/react-table` documentation for detailed column definitions.
- `data`: `TData[]` (required) - An array of data objects to display in the table.

## Features

The `DataTable` component includes the following built-in features:

- **Filtering:** Filters data based on input in the search box (currently configured to filter by `productName`).
- **Sorting:** Allows sorting columns by clicking on the column headers (if `getCanSort()` is enabled in column definition).
- **Pagination:** Provides navigation to move between pages of data.
- **Column Visibility:** Allows users to toggle the visibility of columns (if `getCanHide()` is enabled in column definition).

## Composed Components

This component composes the following UI components:

- [`Input`](docs/components/input.md)
- [`DropdownMenu`](docs/components/dropdown-menu.md) and its sub-components
- [`Table`](src/components/ui/table.tsx), [`TableBody`](src/components/ui/table.tsx), [`TableCell`](src/components/ui/table.tsx), [`TableHead`](src/components/ui/table.tsx), [`TableHeader`](src/components/ui/table.tsx), [`TableRow`](src/components/ui/table.tsx)
