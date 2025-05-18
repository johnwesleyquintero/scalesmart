# IndexedDB Documentation (`src/lib/indexeddb.ts`)

## Overview

The `src/lib/indexeddb.ts` file defines a set of functions for interacting with IndexedDB to manage customer data. These functions provide a way to open the database, create an object store, and perform CRUD (Create, Read, Update, Delete) operations on customer objects.

## Functionality

- **Open Database:** Opens an IndexedDB database.
- **Add Customer:** Adds a new customer to the object store.
- **Update Customer:** Updates an existing customer in the object store.
- **Delete Customer:** Deletes a customer from the object store.
- **Get Customer:** Retrieves a specific customer from the object store by ID.
- **Get All Customers:** Retrieves all customers from the object store.

## Technical Details

- The functions use the `indexedDB` API to interact with IndexedDB.
- The functions use promises to handle asynchronous operations.
- The database name is `crmDatabase`, and the version is `1`.
- The object store name is `customers`, and the key path is `id`.
- Indexes are created for `name`, `email`, `phone`, and `category` fields.

## Usage

```typescript
import { openDB, addCustomer, updateCustomer, deleteCustomer, getCustomer, getAllCustomers } from '@/lib/indexeddb';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  category: string;
}

const MyComponent = async () => {
  // Open the database
  const db = await openDB();

  const newCustomer: Customer = {
    id: '456',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '555-555-5555',
    notes: 'New customer',
    category: 'Gold',
  };

  // Add a new customer
  await addCustomer(newCustomer);

  // Get all customers
  const allCustomers = await getAllCustomers();

  return (
    <div>
      {allCustomers.map((customer) => (
        <p key={customer.id}>{customer.name}</p>
      ))}
    </div>
  );
};
```

## Functions

- `openDB(): Promise<IDBDatabase>`: Opens the IndexedDB database.
- `addCustomer(customer: Customer): Promise<void>`: Adds a new customer to the object store.
- `updateCustomer(customer: Customer): Promise<void>`: Updates an existing customer in the object store.
- `deleteCustomer(id: string): Promise<void>`: Deletes a customer from the object store.
- `getCustomer(id: string): Promise<Customer | undefined>`: Retrieves a specific customer from the object store by ID.
- `getAllCustomers(): Promise<Customer[]>`: Retrieves all customers from the object store.
