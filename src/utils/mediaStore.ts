// IndexedDB & Local Storage Resilient Store for Video/Image Media Uploads
// Solves Firestore ~1MB document limit and provides instant offline media playback.

const IDB_NAME = 'FlipbookStudio_MediaStore_v2';
const IDB_STORE = 'media_files';

// Fast In-Memory Object URL and Data URL Cache to prevent redundant async fetches & avoid flickering
const GLOBAL_MEDIA_CACHE = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable in this environment'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 2);
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
 * Converts an image file to an optimized, high-resolution Base64 Data URL (JPEG / PNG / WebP)
 * This allows images to be stored directly and loaded instantaneously without async delay.
 */
export function fileToDataUrl(file: File, maxDimension = 1600, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    // For SVG or small files (< 350KB), read directly as data URL without compression
    if (file.type === 'image/svg+xml' || file.size < 350 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    // For larger PNG / JPG / WebP images, downscale gracefully on canvas to maintain high quality while keeping payload < 300KB
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Save a video/image File, Blob, or base64 Data URL to IndexedDB under key
 */
export async function saveMediaToIDB(key: string, data: File | Blob | string | ArrayBuffer): Promise<boolean> {
  try {
    const cleanKey = key.startsWith('idb:') ? key.replace('idb:', '') : key;

    // Cache in memory immediately
    if (typeof data === 'string') {
      GLOBAL_MEDIA_CACHE.set(cleanKey, data);
      // If small string (< 2MB), also persist to localStorage for cross-reload safety
      if (data.length < 2 * 1024 * 1024) {
        try {
          localStorage.setItem(`idb_backup_${cleanKey}`, data);
        } catch (_) {}
      }
    } else if (data instanceof File || data instanceof Blob) {
      const objUrl = URL.createObjectURL(data);
      GLOBAL_MEDIA_CACHE.set(cleanKey, objUrl);
    }

    const db = await openDB();

    // Serialize File / Blob to ArrayBuffer or store string directly to avoid structured clone issues
    let payloadToStore: any = data;
    if (data instanceof File || data instanceof Blob) {
      const buffer = await data.arrayBuffer();
      payloadToStore = {
        buffer,
        type: data.type || (data instanceof File ? data.type : 'application/octet-stream'),
        name: (data as any).name || 'media_file',
        updatedAt: Date.now()
      };
    }

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(payloadToStore, cleanKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn('IDB write transaction error, using fallback');
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('saveMediaToIDB error:', err);
    return false;
  }
}

/**
 * Retrieve a video/image Object URL or Data URL from IndexedDB / Memory / LocalStorage
 */
export async function getMediaFromIDB(key: string): Promise<string | null> {
  const cleanKey = key.startsWith('idb:') ? key.replace('idb:', '') : key;

  // 1. Check fast in-memory cache first
  if (GLOBAL_MEDIA_CACHE.has(cleanKey)) {
    return GLOBAL_MEDIA_CACHE.get(cleanKey)!;
  }

  // 2. Check localStorage backup
  try {
    const localBackup = localStorage.getItem(`idb_backup_${cleanKey}`);
    if (localBackup) {
      GLOBAL_MEDIA_CACHE.set(cleanKey, localBackup);
      return localBackup;
    }
  } catch (_) {}

  // 3. Check IndexedDB store
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(cleanKey);

      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result instanceof Blob || result instanceof File) {
          const url = URL.createObjectURL(result);
          GLOBAL_MEDIA_CACHE.set(cleanKey, url);
          resolve(url);
        } else if (typeof result === 'string') {
          GLOBAL_MEDIA_CACHE.set(cleanKey, result);
          resolve(result);
        } else if (result && result.buffer instanceof ArrayBuffer) {
          const blob = new Blob([result.buffer], { type: result.type || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          GLOBAL_MEDIA_CACHE.set(cleanKey, url);
          resolve(url);
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

