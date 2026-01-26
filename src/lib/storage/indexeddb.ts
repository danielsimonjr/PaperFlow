const DB_NAME = 'paperflow';
const DB_VERSION = 1;

interface RecentFile {
  id: string;
  name: string;
  size: number;
  lastOpened: Date;
  thumbnail?: string;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for recent files metadata
        if (!db.objectStoreNames.contains('recentFiles')) {
          const store = db.createObjectStore('recentFiles', { keyPath: 'id' });
          store.createIndex('lastOpened', 'lastOpened', { unique: false });
        }

        // Store for document data (ArrayBuffer)
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }

        // Store for signatures
        if (!db.objectStoreNames.contains('signatures')) {
          db.createObjectStore('signatures', { keyPath: 'id' });
        }
      };
    });
  }

  async addRecentFile(file: RecentFile): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recentFiles'], 'readwrite');
      const store = transaction.objectStore('recentFiles');
      const request = store.put(file);

      request.onerror = () => reject(new Error('Failed to add recent file'));
      request.onsuccess = () => resolve();
    });
  }

  async getRecentFiles(limit: number = 10): Promise<RecentFile[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recentFiles'], 'readonly');
      const store = transaction.objectStore('recentFiles');
      const index = store.index('lastOpened');
      const request = index.openCursor(null, 'prev');

      const results: RecentFile[] = [];

      request.onerror = () => reject(new Error('Failed to get recent files'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  async removeRecentFile(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recentFiles'], 'readwrite');
      const store = transaction.objectStore('recentFiles');
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to remove recent file'));
      request.onsuccess = () => resolve();
    });
  }

  async saveDocument(id: string, data: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.put({ id, data });

      request.onerror = () => reject(new Error('Failed to save document'));
      request.onsuccess = () => resolve();
    });
  }

  async getDocument(id: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get document'));
      request.onsuccess = () => {
        resolve(request.result?.data ?? null);
      };
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    const stores = ['recentFiles', 'documents', 'signatures'];

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
        request.onsuccess = () => resolve();
      });
    }
  }
}

export const storage = new IndexedDBStorage();
