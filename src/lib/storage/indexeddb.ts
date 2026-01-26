const DB_NAME = 'paperflow';
const DB_VERSION = 2;

export interface RecentFile {
  id: string;
  name: string;
  size: number;
  lastOpened: Date;
  thumbnail?: string;
}

export interface AutoSaveEntry {
  id: string;
  documentId: string;
  fileName: string;
  data: ArrayBuffer;
  savedAt: Date;
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
        const oldVersion = event.oldVersion;

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

        // Store for auto-save (added in version 2)
        if (oldVersion < 2 && !db.objectStoreNames.contains('autoSave')) {
          const store = db.createObjectStore('autoSave', { keyPath: 'id' });
          store.createIndex('documentId', 'documentId', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });
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

    const stores = ['recentFiles', 'documents', 'signatures', 'autoSave'];

    for (const storeName of stores) {
      if (this.db!.objectStoreNames.contains(storeName)) {
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

  async clearRecentFiles(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['recentFiles'], 'readwrite');
      const store = transaction.objectStore('recentFiles');
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear recent files'));
      request.onsuccess = () => resolve();
    });
  }

  // Auto-save methods
  async saveAutoSave(entry: AutoSaveEntry): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readwrite');
      const store = transaction.objectStore('autoSave');
      const request = store.put(entry);

      request.onerror = () => reject(new Error('Failed to save auto-save entry'));
      request.onsuccess = () => resolve();
    });
  }

  async getAutoSave(documentId: string): Promise<AutoSaveEntry | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readonly');
      const store = transaction.objectStore('autoSave');
      const index = store.index('documentId');
      const request = index.openCursor(IDBKeyRange.only(documentId), 'prev');

      request.onerror = () => reject(new Error('Failed to get auto-save'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve(null);
        }
      };
    });
  }

  async removeAutoSave(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readwrite');
      const store = transaction.objectStore('autoSave');
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to remove auto-save'));
      request.onsuccess = () => resolve();
    });
  }

  async clearAutoSaves(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readwrite');
      const store = transaction.objectStore('autoSave');
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear auto-saves'));
      request.onsuccess = () => resolve();
    });
  }

  // Clean up old auto-saves (keep only last N entries)
  async cleanupOldAutoSaves(keepCount: number = 5): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readwrite');
      const store = transaction.objectStore('autoSave');
      const index = store.index('savedAt');
      const request = index.openCursor(null, 'prev');

      let count = 0;
      const toDelete: string[] = [];

      request.onerror = () => reject(new Error('Failed to cleanup auto-saves'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          count++;
          if (count > keepCount) {
            toDelete.push(cursor.value.id);
          }
          cursor.continue();
        } else {
          // Delete old entries
          Promise.all(toDelete.map((id) => this.removeAutoSave(id)))
            .then(() => resolve())
            .catch(reject);
        }
      };
    });
  }
}

export const storage = new IndexedDBStorage();
