import type { FormField } from '@/types/forms';

const DB_NAME = 'paperflow';
const STORE_NAME = 'formData';

/**
 * Stored form data structure
 */
interface StoredFormData {
  documentId: string;
  fieldValues: Record<string, unknown>;
  savedAt: Date;
}

/**
 * Initialize IndexedDB for form storage
 */
async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB for form storage'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create form data store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'documentId' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
  });
}

/**
 * Save form field values to IndexedDB
 */
export async function saveFormData(
  documentId: string,
  fields: FormField[]
): Promise<void> {
  const db = await getDB();

  const fieldValues: Record<string, unknown> = {};
  for (const field of fields) {
    const key = field.name || field.id;
    fieldValues[key] = field.value;
  }

  const data: StoredFormData = {
    documentId,
    fieldValues,
    savedAt: new Date(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onerror = () => {
      reject(new Error('Failed to save form data'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Load form field values from IndexedDB
 */
export async function loadFormData(
  documentId: string
): Promise<Record<string, unknown> | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(documentId);

    request.onerror = () => {
      reject(new Error('Failed to load form data'));
    };

    request.onsuccess = () => {
      const result = request.result as StoredFormData | undefined;
      resolve(result?.fieldValues ?? null);
    };
  });
}

/**
 * Delete saved form data
 */
export async function deleteFormData(documentId: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(documentId);

    request.onerror = () => {
      reject(new Error('Failed to delete form data'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Check if saved form data exists for a document
 */
export async function hasFormData(documentId: string): Promise<boolean> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getKey(documentId);

    request.onerror = () => {
      reject(new Error('Failed to check form data'));
    };

    request.onsuccess = () => {
      resolve(request.result !== undefined);
    };
  });
}

/**
 * Get the last saved timestamp for form data
 */
export async function getFormDataTimestamp(
  documentId: string
): Promise<Date | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(documentId);

    request.onerror = () => {
      reject(new Error('Failed to get form data timestamp'));
    };

    request.onsuccess = () => {
      const result = request.result as StoredFormData | undefined;
      resolve(result?.savedAt ? new Date(result.savedAt) : null);
    };
  });
}

/**
 * Clear all saved form data
 */
export async function clearAllFormData(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error('Failed to clear form data'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
