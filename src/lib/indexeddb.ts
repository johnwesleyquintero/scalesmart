const DB_NAME = 'crmDatabase';
const DB_VERSION = 2;
const OBJECT_STORE_NAME = 'customers';

interface Category {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  category: string | null;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB opened successfully:', db.objectStoreNames);
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        const objectStore = db.createObjectStore(OBJECT_STORE_NAME, {
          keyPath: 'id',
        });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('email', 'email', { unique: false });
        objectStore.createIndex('phone', 'phone', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains('categories')) {
        console.log('Creating categories object store');
        const categoriesObjectStore = db.createObjectStore('categories', {
          keyPath: 'id',
        });
        categoriesObjectStore.createIndex('name', 'name', { unique: false });
      }
    };
  });
};

const addCustomer = async (customer: Customer): Promise<void> => {
  const db = await openDB();
  console.log('Adding customer:', customer);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const request = objectStore.add({ ...customer });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to add customer'));

    transaction.oncomplete = () => db.close();
  });
};

const updateCustomer = async (customer: Customer): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const request = objectStore.put({ ...customer });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to update customer'));

    transaction.oncomplete = () => db.close();
  });
};

const deleteCustomer = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const request = objectStore.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete customer'));

    transaction.oncomplete = () => db.close();
  });
};

const getCustomer = async (id: string): Promise<Customer | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const request = objectStore.get(id);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as Customer);
    };
    request.onerror = () => reject(new Error('Failed to get customer'));

    transaction.oncomplete = () => db.close();
  });
};

const getAllCustomers = async (): Promise<Customer[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as Customer[]);
    };
    request.onerror = () => reject(new Error('Failed to get all customers'));

    transaction.oncomplete = () => db.close();
  });
};

const addCategory = async (category: Category): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const objectStore = transaction.objectStore('categories');
    const request = objectStore.add({ ...category });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to add category'));

    transaction.oncomplete = () => db.close();
  });
};

const updateCategory = async (category: Category): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const objectStore = transaction.objectStore('categories');
    const request = objectStore.put({ ...category });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to update category'));

    transaction.oncomplete = () => db.close();
  });
};

const deleteCategory = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const objectStore = transaction.objectStore('categories');
    const request = objectStore.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete category'));

    transaction.oncomplete = () => db.close();
  });
};

const getCategory = async (id: string): Promise<Category | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readonly');
    const objectStore = transaction.objectStore('categories');
    const request = objectStore.get(id);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as Category);
    };
    request.onerror = () => reject(new Error('Failed to get category'));

    transaction.oncomplete = () => db.close();
  });
};

const getAllCategories = async (): Promise<Category[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readonly');
    const objectStore = transaction.objectStore('categories');
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as Category[]);
    };
    request.onerror = () => reject(new Error('Failed to get all categories'));

    transaction.oncomplete = () => db.close();
  });
};

// These functions are not needed anymore, but we need to keep them to avoid errors
const getItem = (): null => {
  console.warn('getItem is deprecated');
  return null;
};

const setItem = (): void => {
  console.warn('setItem is deprecated');
};

const removeItem = (): void => {
  console.warn('removeItem is deprecated');
};

export {
  openDB,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomer,
  getAllCustomers,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
  getItem,
  setItem,
  removeItem,
};
