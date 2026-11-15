/**
 * Browser Storage Persistence & Management Service
 * Provides client-side persistent storage permission via StorageManager API,
 * quota tracking, and cache reset capabilities.
 */

export interface StorageInfo {
  isSupported: boolean;
  isPersisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) return true;
    const granted = await navigator.storage.persist();
    return granted;
  } catch (err) {
    console.warn('Storage persistence request failed:', err);
    return false;
  }
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const fallback: StorageInfo = {
    isSupported: false,
    isPersisted: false,
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: '0 B',
    quotaFormatted: '0 B',
    percentUsed: 0
  };

  if (typeof window === 'undefined' || !navigator.storage) {
    return fallback;
  }

  try {
    const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    let usageBytes = 0;
    let quotaBytes = 0;

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    }

    const percentUsed = quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 100)) : 0;

    return {
      isSupported: true,
      isPersisted,
      usageBytes,
      quotaBytes,
      usageFormatted: formatBytes(usageBytes),
      quotaFormatted: formatBytes(quotaBytes),
      percentUsed
    };
  } catch (err) {
    console.warn('Error reading storage info:', err);
    return fallback;
  }
}

export async function clearAllLocalData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Clear LocalStorage and SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 2. Delete IndexedDB databases
    if (window.indexedDB && window.indexedDB.databases) {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    }
  } catch (err) {
    console.error('Error clearing local data:', err);
  }
}
