/**
 * Secure signature storage using IndexedDB with optional encryption.
 * Uses Web Crypto API for encrypting signature data at rest.
 */

import type { StoredSignature } from '@stores/signatureStore';

const DB_NAME = 'paperflow';
const STORE_NAME = 'signatures';
const MAX_SIGNATURES = 10;

// Encryption key stored in memory (derived from a static seed for this session)
let encryptionKey: CryptoKey | null = null;

/**
 * Initialize the encryption key using Web Crypto API
 */
async function initEncryptionKey(): Promise<CryptoKey> {
  if (encryptionKey) return encryptionKey;

  // Generate a key from a fixed seed (in production, this should be derived from user credentials)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('paperflow-signature-key-v1'),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  encryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('paperflow-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return encryptionKey;
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data: string): Promise<string> {
  const key = await initEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encryptedData: string): Promise<string> {
  const key = await initEncryptionKey();

  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Serialize signature for storage
 */
interface SerializedSignature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  encryptedData: string;
  isDefault: boolean;
  isInitials: boolean;
  createdAt: string;
}

/**
 * Save a signature to IndexedDB with encryption
 */
export async function saveSignature(signature: StoredSignature): Promise<void> {
  const db = await openDB();

  // Check signature count by type
  const isInitials = signature.isInitials;
  const typeCount = await getSignatureCountByType(isInitials);

  if (typeCount >= MAX_SIGNATURES) {
    throw new Error(`Maximum ${MAX_SIGNATURES} ${isInitials ? 'initials' : 'signatures'} reached`);
  }

  // Encrypt the signature data
  const encryptedData = await encryptData(signature.data);

  const serialized: SerializedSignature = {
    id: signature.id,
    name: signature.name,
    type: signature.type,
    encryptedData,
    isDefault: signature.isDefault,
    isInitials: signature.isInitials,
    createdAt: signature.createdAt.toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(serialized);

    request.onerror = () => reject(new Error('Failed to save signature'));
    request.onsuccess = () => resolve();
  });
}

/**
 * Load all signatures from IndexedDB with decryption
 */
export async function loadSignatures(): Promise<StoredSignature[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(new Error('Failed to load signatures'));
    request.onsuccess = async () => {
      try {
        const serialized: SerializedSignature[] = request.result;
        const signatures: StoredSignature[] = [];

        for (const item of serialized) {
          try {
            const data = await decryptData(item.encryptedData);
            signatures.push({
              id: item.id,
              name: item.name,
              type: item.type,
              data,
              isDefault: item.isDefault,
              isInitials: item.isInitials,
              createdAt: new Date(item.createdAt),
            });
          } catch (error) {
            console.error(`Failed to decrypt signature ${item.id}:`, error);
          }
        }

        resolve(signatures);
      } catch (error) {
        reject(error);
      }
    };
  });
}

/**
 * Load a single signature by ID
 */
export async function loadSignature(id: string): Promise<StoredSignature | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(new Error('Failed to load signature'));
    request.onsuccess = async () => {
      try {
        const item: SerializedSignature | undefined = request.result;
        if (!item) {
          resolve(null);
          return;
        }

        const data = await decryptData(item.encryptedData);
        resolve({
          id: item.id,
          name: item.name,
          type: item.type,
          data,
          isDefault: item.isDefault,
          isInitials: item.isInitials,
          createdAt: new Date(item.createdAt),
        });
      } catch (error) {
        reject(error);
      }
    };
  });
}

/**
 * Delete a signature from IndexedDB
 */
export async function deleteSignature(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(new Error('Failed to delete signature'));
    request.onsuccess = () => resolve();
  });
}

/**
 * Update a signature in IndexedDB
 */
export async function updateSignature(id: string, updates: Partial<StoredSignature>): Promise<void> {
  const existing = await loadSignature(id);
  if (!existing) {
    throw new Error(`Signature ${id} not found`);
  }

  const updated: StoredSignature = { ...existing, ...updates };
  await saveSignature(updated);
}

/**
 * Get total signature count
 */
export async function getSignatureCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onerror = () => reject(new Error('Failed to count signatures'));
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get signature count by type (signatures vs initials)
 */
export async function getSignatureCountByType(isInitials: boolean): Promise<number> {
  const signatures = await loadSignatures();
  return signatures.filter((s) => s.isInitials === isInitials).length;
}

/**
 * Clear all signatures from IndexedDB
 */
export async function clearAllSignatures(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(new Error('Failed to clear signatures'));
    request.onsuccess = () => resolve();
  });
}

/**
 * Set a signature as default
 */
export async function setDefaultSignature(id: string): Promise<void> {
  const signatures = await loadSignatures();
  const target = signatures.find((s) => s.id === id);

  if (!target) {
    throw new Error(`Signature ${id} not found`);
  }

  // Update all signatures of the same type
  for (const sig of signatures) {
    if (sig.isInitials === target.isInitials) {
      await saveSignature({ ...sig, isDefault: sig.id === id });
    }
  }
}

/**
 * Export signatures for backup (without encryption)
 */
export async function exportSignatures(): Promise<StoredSignature[]> {
  return loadSignatures();
}

/**
 * Import signatures from backup
 */
export async function importSignatures(signatures: StoredSignature[]): Promise<void> {
  for (const signature of signatures) {
    await saveSignature(signature);
  }
}
