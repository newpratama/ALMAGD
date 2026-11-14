import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import type { QueryClient } from '@tanstack/react-query';

const DB_NAME = 'almagd_pms_cache_v2';
const STORE_NAME = 'query_cache';
const PERSIST_KEY = 'ALMAGD_PMS_REACT_QUERY_CACHE';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB unavailable'));
    }

    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export const idbStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as string) || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      // Fallback to localStorage if IndexedDB is blocked (e.g. private mode)
      try {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // Ignore quota errors
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      } catch {
        // Ignore
      }
    }
  },
};

export const asyncPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: PERSIST_KEY,
  throttleTime: 1000,
});

/**
 * Configure query persistence for browser storage (IndexedDB with localStorage fallback).
 * Ensures reports, bookings, and dashboard data load instantly (0ms) from local cache
 * and update automatically in background via stale-while-revalidate.
 */
export function setupQueryPersistence(queryClient: QueryClient) {
  if (typeof window === 'undefined') return;

  persistQueryClient({
    queryClient: queryClient as any,
    persister: asyncPersister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days retention
    buster: 'almagd-reports-v2',
    dehydrateOptions: {
      shouldDehydrateQuery: (query: any) => {
        // Only persist successful queries, skip error states
        if (query.state.status !== 'success') return false;

        const qKey = query.queryKey;
        if (!Array.isArray(qKey) || qKey.length === 0) return true;

        // Persist reports, units, sources, calendar, and operational data
        const prefix = String(qKey[0]);
        const persistablePrefixes = [
          'report-daily',
          'report-source',
          'report-channel-collections',
          'report-daily-operational',
          'unit-revenue-performance',
          'units',
          'booking-sources',
          'today',
          'calendar',
          'bookings',
          'payments',
        ];

        return persistablePrefixes.some((p) => prefix.startsWith(p));
      },
    },
  });
}
