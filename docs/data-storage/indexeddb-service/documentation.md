# IndexedDB Service Documentation (`src/lib/indexeddb-service.ts`)

## Overview

The `src/lib/indexeddb-service.ts` file defines a set of utility functions for interacting with IndexedDB. These functions provide a simple and consistent way to perform common IndexedDB operations, such as opening a database, creating an object store, adding data, getting data, and deleting data.

## Functionality

- **Initialize Database:** Initializes the IndexedDB database, creating object stores if they don't exist.
- **Add Data:** Adds data to the object store.
- **Get Data:** Gets data from the object store by key.
- **Delete Data:** Deletes data from the object store by key.

## Technical Details

- The functions use the `indexedDB` API to interact with IndexedDB.
- The functions use promises to handle asynchronous operations.
- The functions provide error handling for common IndexedDB errors.
- The `initializeDB` function is responsible for opening the database and creating the object stores.
- The object stores are created with a `keyPath` that defines the primary key for the store.

## Usage

Assuming an object store named 'courses' with keyPath 'id':

```typescript
import { initializeDB, setItem, getItem, removeItem } from '@/lib/indexeddb-service';

interface Course {
  id: string;
  name: string;
  description: string;
}

const MyComponent = async () => {
  // Initialize the database
  await initializeDB();

  const course: Course = {
    id: '123',
    name: 'My Course',
    description: 'This is a great course',
  };

  // Add data to the object store, using the 'id' as the key
  await setItem('courses', course.id, course);

  // Get data from the object store, using the 'id' as the key
  const value = await getItem<Course>('courses', '123');

  // Delete data from the object store, using the 'id' as the key
  await removeItem('courses', '123');

  return (
    <div>
      <p>Course Name: {value?.name}</p>
    </div>
  );
};
```

## Functions

- `initializeDB(): Promise<IDBDatabase>`: Initializes the IndexedDB database.
- `setItem<T>(storeName: string, key: string, value: T): Promise<void>`: Adds or updates data in the specified object store, where `key` must match the object's keyPath property.
- `getItem<T>(storeName: string, key: string): Promise<T | undefined>`: Retrieves data from the specified object store by its key (keyPath).
- `removeItem(storeName: string, key: string): Promise<void>`: Deletes data from the specified object store by its key (keyPath).
