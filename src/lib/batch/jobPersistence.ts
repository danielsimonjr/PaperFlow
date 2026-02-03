/**
 * Batch Job Persistence
 * Handles saving and loading batch jobs to/from IndexedDB for recovery across restarts.
 */

import type { BatchJob, BatchTemplate } from '@/types/batch';

const DB_NAME = 'paperflow-batch';
const DB_VERSION = 1;
const JOBS_STORE = 'jobs';
const TEMPLATES_STORE = 'templates';

/**
 * Open IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open batch database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create jobs store
      if (!db.objectStoreNames.contains(JOBS_STORE)) {
        const jobsStore = db.createObjectStore(JOBS_STORE, { keyPath: 'id' });
        jobsStore.createIndex('status', 'status', { unique: false });
        jobsStore.createIndex('createdAt', 'createdAt', { unique: false });
        jobsStore.createIndex('type', 'type', { unique: false });
      }

      // Create templates store
      if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
        const templatesStore = db.createObjectStore(TEMPLATES_STORE, { keyPath: 'id' });
        templatesStore.createIndex('operationType', 'operationType', { unique: false });
        templatesStore.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

/**
 * Save a batch job
 */
export async function saveJob(job: BatchJob): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE], 'readwrite');
    const store = transaction.objectStore(JOBS_STORE);
    const request = store.put(job);

    request.onerror = () => {
      reject(new Error('Failed to save job'));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load a batch job by ID
 */
export async function loadJob(jobId: string): Promise<BatchJob | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE], 'readonly');
    const store = transaction.objectStore(JOBS_STORE);
    const request = store.get(jobId);

    request.onerror = () => {
      reject(new Error('Failed to load job'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load all batch jobs
 */
export async function loadAllJobs(): Promise<BatchJob[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE], 'readonly');
    const store = transaction.objectStore(JOBS_STORE);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('Failed to load jobs'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load jobs by status
 */
export async function loadJobsByStatus(status: string): Promise<BatchJob[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE], 'readonly');
    const store = transaction.objectStore(JOBS_STORE);
    const index = store.index('status');
    const request = index.getAll(status);

    request.onerror = () => {
      reject(new Error('Failed to load jobs by status'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a batch job
 */
export async function deleteJob(jobId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE], 'readwrite');
    const store = transaction.objectStore(JOBS_STORE);
    const request = store.delete(jobId);

    request.onerror = () => {
      reject(new Error('Failed to delete job'));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete all jobs with a specific status
 */
export async function deleteJobsByStatus(status: string): Promise<number> {
  const jobs = await loadJobsByStatus(status);
  let deleted = 0;

  for (const job of jobs) {
    await deleteJob(job.id);
    deleted++;
  }

  return deleted;
}

/**
 * Clear all jobs
 */
export async function clearAllJobs(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE], 'readwrite');
    const store = transaction.objectStore(JOBS_STORE);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error('Failed to clear jobs'));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Save a batch template
 */
export async function saveTemplate(template: BatchTemplate): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEMPLATES_STORE], 'readwrite');
    const store = transaction.objectStore(TEMPLATES_STORE);
    const request = store.put(template);

    request.onerror = () => {
      reject(new Error('Failed to save template'));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load a batch template by ID
 */
export async function loadTemplate(templateId: string): Promise<BatchTemplate | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEMPLATES_STORE], 'readonly');
    const store = transaction.objectStore(TEMPLATES_STORE);
    const request = store.get(templateId);

    request.onerror = () => {
      reject(new Error('Failed to load template'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load all batch templates
 */
export async function loadAllTemplates(): Promise<BatchTemplate[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEMPLATES_STORE], 'readonly');
    const store = transaction.objectStore(TEMPLATES_STORE);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('Failed to load templates'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Load templates by operation type
 */
export async function loadTemplatesByType(
  operationType: string
): Promise<BatchTemplate[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEMPLATES_STORE], 'readonly');
    const store = transaction.objectStore(TEMPLATES_STORE);
    const index = store.index('operationType');
    const request = index.getAll(operationType);

    request.onerror = () => {
      reject(new Error('Failed to load templates by type'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a batch template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEMPLATES_STORE], 'readwrite');
    const store = transaction.objectStore(TEMPLATES_STORE);
    const request = store.delete(templateId);

    request.onerror = () => {
      reject(new Error('Failed to delete template'));
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await openDatabase();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  jobCount: number;
  templateCount: number;
}> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([JOBS_STORE, TEMPLATES_STORE], 'readonly');

    let jobCount = 0;
    let templateCount = 0;

    const jobsStore = transaction.objectStore(JOBS_STORE);
    const jobsCountRequest = jobsStore.count();

    jobsCountRequest.onsuccess = () => {
      jobCount = jobsCountRequest.result;
    };

    const templatesStore = transaction.objectStore(TEMPLATES_STORE);
    const templatesCountRequest = templatesStore.count();

    templatesCountRequest.onsuccess = () => {
      templateCount = templatesCountRequest.result;
    };

    transaction.onerror = () => {
      reject(new Error('Failed to get database stats'));
    };

    transaction.oncomplete = () => {
      db.close();
      resolve({ jobCount, templateCount });
    };
  });
}

/**
 * Load incomplete jobs (for recovery)
 */
export async function loadIncompleteJobs(): Promise<BatchJob[]> {
  const allJobs = await loadAllJobs();
  return allJobs.filter(
    (job) =>
      job.status === 'processing' ||
      job.status === 'paused' ||
      job.status === 'queued' ||
      job.status === 'pending'
  );
}

/**
 * Update job status in persistence
 */
export async function updateJobStatus(
  jobId: string,
  status: string
): Promise<void> {
  const job = await loadJob(jobId);
  if (job) {
    job.status = status as BatchJob['status'];
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      job.completedAt = Date.now();
    }
    await saveJob(job);
  }
}
