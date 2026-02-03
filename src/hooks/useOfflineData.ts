/**
 * Offline-First Data Hook
 *
 * React hook that automatically handles offline/online data fetching
 * with caching and sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineStore } from '@/stores/offlineStore';
import { offlineStorage } from '@/lib/offline/offlineStorage';
import { offlineQueue } from '@/lib/offline/offlineQueue';
import type { OfflineDocument, OfflineDocumentMetadata } from '@/types/offline';

/**
 * Offline data state
 */
interface OfflineDataState<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  source: 'cache' | 'network' | null;
  lastFetched: Date | null;
}

/**
 * Offline data options
 */
interface UseOfflineDataOptions<T> {
  /**
   * Unique key for caching
   */
  key: string;

  /**
   * Function to fetch fresh data from network
   */
  fetcher?: () => Promise<T>;

  /**
   * Function to get cached data
   */
  getCached?: () => Promise<T | null>;

  /**
   * Function to cache data
   */
  setCache?: (data: T) => Promise<void>;

  /**
   * Time in milliseconds before data is considered stale
   */
  staleTime?: number;

  /**
   * Whether to refetch when coming back online
   */
  refetchOnReconnect?: boolean;

  /**
   * Whether to refetch on window focus
   */
  refetchOnFocus?: boolean;

  /**
   * Initial data
   */
  initialData?: T;
}

/**
 * Hook for offline-first data fetching
 */
export function useOfflineData<T>({
  key,
  fetcher,
  getCached,
  setCache,
  staleTime = 5 * 60 * 1000, // 5 minutes
  refetchOnReconnect = true,
  refetchOnFocus = false,
  initialData,
}: UseOfflineDataOptions<T>): OfflineDataState<T> & {
  refetch: () => Promise<void>;
  mutate: (data: T) => Promise<void>;
} {
  const [state, setState] = useState<OfflineDataState<T>>({
    data: initialData ?? null,
    isLoading: true,
    isStale: false,
    error: null,
    source: null,
    lastFetched: null,
  });

  const isOnline = useOfflineStore((state) => state.isOnline);
  const lastFetchedRef = useRef<Date | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch data from network or cache
   */
  const fetchData = useCallback(
    async (forceNetwork = false) => {
      if (!isMountedRef.current) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Try cache first if not forcing network
        if (!forceNetwork && getCached) {
          const cached = await getCached();
          if (cached !== null) {
            const isStale =
              lastFetchedRef.current !== null &&
              Date.now() - lastFetchedRef.current.getTime() > staleTime;

            setState((prev) => ({
              ...prev,
              data: cached,
              isLoading: isStale && isOnline,
              isStale,
              source: 'cache',
              lastFetched: lastFetchedRef.current,
            }));

            // If stale and online, fetch fresh data in background
            if (isStale && isOnline && fetcher) {
              try {
                const fresh = await fetcher();
                if (setCache) {
                  await setCache(fresh);
                }
                lastFetchedRef.current = new Date();

                if (isMountedRef.current) {
                  setState({
                    data: fresh,
                    isLoading: false,
                    isStale: false,
                    error: null,
                    source: 'network',
                    lastFetched: lastFetchedRef.current,
                  });
                }
              } catch (error) {
                // Silently fail background refresh, we have cached data
                console.warn('Background refresh failed:', error);
              }
            }

            return;
          }
        }

        // Try network if online
        if (isOnline && fetcher) {
          const data = await fetcher();
          if (setCache) {
            await setCache(data);
          }
          lastFetchedRef.current = new Date();

          if (isMountedRef.current) {
            setState({
              data,
              isLoading: false,
              isStale: false,
              error: null,
              source: 'network',
              lastFetched: lastFetchedRef.current,
            });
          }
          return;
        }

        // Offline and no cache
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: new Error('No cached data available offline'),
          }));
        }
      } catch (error) {
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }));
        }
      }
    },
    [fetcher, getCached, setCache, staleTime, isOnline]
  );

  /**
   * Refetch data
   */
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Mutate data locally
   */
  const mutate = useCallback(
    async (data: T) => {
      setState((prev) => ({
        ...prev,
        data,
        isStale: false,
      }));

      if (setCache) {
        await setCache(data);
      }

      // Queue for sync if offline
      if (!isOnline) {
        await offlineQueue.enqueue('update', key, { data });
      }
    },
    [key, setCache, isOnline]
  );

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Refetch on reconnect
  useEffect(() => {
    if (refetchOnReconnect && isOnline && state.isStale) {
      fetchData(true);
    }
  }, [isOnline, refetchOnReconnect, state.isStale, fetchData]);

  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (state.isStale) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, state.isStale, fetchData]);

  return {
    ...state,
    refetch,
    mutate,
  };
}

/**
 * Hook for offline document access
 */
export function useOfflineDocument(documentId: string | null) {
  return useOfflineData<OfflineDocument | null>({
    key: `document-${documentId}`,
    getCached: async () => {
      if (!documentId) return null;
      return offlineStorage.getDocument(documentId);
    },
    setCache: async (data) => {
      if (data) {
        await offlineStorage.saveDocument(data);
      }
    },
    initialData: null,
  });
}

/**
 * Hook for offline document list
 */
export function useOfflineDocuments() {
  return useOfflineData<OfflineDocumentMetadata[]>({
    key: 'offline-documents',
    getCached: async () => {
      return offlineStorage.getAllDocumentMetadata();
    },
    initialData: [],
  });
}
