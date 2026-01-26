/**
 * Custom stamp storage using IndexedDB.
 */

const DB_NAME = 'paperflow-stamps';
const DB_VERSION = 1;
const STORE_NAME = 'custom-stamps';

export interface CustomStamp {
  id: string;
  text: string;
  color: string;
  backgroundColor: string;
  createdAt: Date;
}

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database for stamp storage.
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open stamp database'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Save a custom stamp to storage.
 */
export async function saveCustomStamp(stamp: Omit<CustomStamp, 'id' | 'createdAt'>): Promise<CustomStamp> {
  const database = await initDB();

  const customStamp: CustomStamp = {
    ...stamp,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(customStamp);

    request.onsuccess = () => {
      resolve(customStamp);
    };

    request.onerror = () => {
      reject(new Error('Failed to save custom stamp'));
    };
  });
}

/**
 * Get all custom stamps from storage.
 */
export async function getAllCustomStamps(): Promise<CustomStamp[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const stamps = request.result.map((stamp) => ({
        ...stamp,
        createdAt: new Date(stamp.createdAt),
      }));

      // Sort by creation date (newest first)
      stamps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      resolve(stamps);
    };

    request.onerror = () => {
      reject(new Error('Failed to get custom stamps'));
    };
  });
}

/**
 * Delete a custom stamp from storage.
 */
export async function deleteCustomStamp(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete custom stamp'));
    };
  });
}

/**
 * Update a custom stamp in storage.
 */
export async function updateCustomStamp(
  id: string,
  updates: Partial<Omit<CustomStamp, 'id' | 'createdAt'>>
): Promise<CustomStamp | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        resolve(null);
        return;
      }

      const updatedStamp: CustomStamp = {
        ...getRequest.result,
        ...updates,
        createdAt: new Date(getRequest.result.createdAt),
      };

      const putRequest = store.put(updatedStamp);

      putRequest.onsuccess = () => {
        resolve(updatedStamp);
      };

      putRequest.onerror = () => {
        reject(new Error('Failed to update custom stamp'));
      };
    };

    getRequest.onerror = () => {
      reject(new Error('Failed to get custom stamp for update'));
    };
  });
}

/**
 * Clear all custom stamps from storage.
 */
export async function clearAllCustomStamps(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear custom stamps'));
    };
  });
}

/**
 * Get the count of custom stamps.
 */
export async function getCustomStampCount(): Promise<number> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to count custom stamps'));
    };
  });
}
