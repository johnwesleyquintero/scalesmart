# CRM Dashboard Documentation (`src/app/crm/page.tsx`)

## Overview

The `src/app/crm/page.tsx` file defines a CRM (Customer Relationship Management) dashboard. It allows users to add, edit, delete, search, and categorize customers. The data is stored in IndexedDB.

## Functionality

- **Add New Customer:** Allows users to add new customers with their name, email, phone, category, and notes.
- **Edit Existing Customer:** Allows users to edit the information of existing customers.
- **Delete Customer:** Allows users to delete customers.
- **Search Customers:** Allows users to search for customers by name, email, or phone.
- **Filter Customers by Category:** Allows users to filter customers by category.
- **Export Customers to CSV:** Allows users to export the customer data to a CSV file.
- **Copy Notes to Clipboard:** Allows users to copy the notes of a customer to the clipboard as Markdown.

## Technical Details

- The page is a client-side component.
- The page uses IndexedDB to store the customer data.
- The page uses the `ui/button`, `ui/card`, `ui/input`, `ui/label`, and `ui/textarea` components from the `@/components/ui` library.
- The page uses the `lucide-react` library for icons.
- The page uses the `sonner` library for toast notifications.
- The page uses the `react-markdown` library to render the notes as Markdown.

## Data Flow

1.  The `CRMComponent` is rendered.
2.  The component initializes the `customers` state with the data from IndexedDB.
3.  The user interacts with the form to add, edit, or delete customers.
4.  The `handleSaveCustomer` function is called when the user submits the form.
5.  The `handleEdit` function is called when the user clicks the "Edit" button.
6.  The `handleDelete` function is called when the user clicks the "Delete" button.
7.  The `exportTasksToCSV` function is called when the user clicks the "Export CSV" button.
8.  The `handleCopyToClipboard` function is called when the user clicks the "Copy" button.
9.  The `customers` state is updated, and the changes are automatically persisted to IndexedDB.
