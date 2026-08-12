// IndexedDB Persistent Store for Video/Image Media Uploads
// Solves Firestore ~1MB document limit and localStorage 5MB quota limits.

const IDB_NAME = 'FlipbookStudio_MediaStore';
const IDB_STORE = 'media_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save a video/image File, Blob, or base64 Data URL to IndexedDB under key
 */
export async function saveMediaToIDB(key: string, data: File | Blob | string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(data, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('saveMediaToIDB error:', err);
    return false;
  }
}

/**
 * Retrieve a video/image Object URL or Data URL from IndexedDB
 */
export async function getMediaFromIDB(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }
        if (result instanceof Blob || result instanceof File) {
          resolve(URL.createObjectURL(result));
        } else if (typeof result === 'string') {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('getMediaFromIDB error:', err);
    return null;
  }
}
