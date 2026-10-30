/**
 * Encrypted Client Cache using native Web Crypto AES-GCM 256-bit and IndexedDB.
 * Pattern modeled directly after the OUD enterprise architecture.
 *
 * Security principles:
 * - Ciphertext only stored in IndexedDB ('almagd-cache-v1').
 * - Encryption key lives in RAM only (never stored in cookies or localStorage).
 * - Automatic eviction / clearing upon logout or session invalidation.
 */

const DB_NAME = 'almagd-cache-v1';
const STORE_NAME = 'encrypted_reads';

interface EncryptedRecord {
  id: string;
  scope: string;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  savedAt: number;
}

class EncryptedStorageBackend {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB not supported in this environment'));
          return;
        }

        const request = indexedDB.open(DB_NAME, 1);
        const timer = setTimeout(() => reject(new Error('IndexedDB open timeout')), 3000);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('scope', 'scope', { unique: false });
          }
        };

        request.onsuccess = () => {
          clearTimeout(timer);
          resolve(request.result);
        };

        request.onerror = () => {
          clearTimeout(timer);
          reject(request.error);
        };
      });
    }
    return this.dbPromise;
  }

  async get(id: string): Promise<EncryptedRecord | null> {
    try {
      const db = await this.open();
      return new Promise<EncryptedRecord | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async put(record: EncryptedRecord): Promise<void> {
    try {
      const db = await this.open();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore write errors if storage quota exceeded or private mode
    }
  }

  async clearScope(scope: string): Promise<void> {
    try {
      const db = await this.open();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('scope');
        const req = index.openCursor(scope);
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore
    }
  }
}

class EncryptedCacheManager {
  private key: CryptoKey | null = null;
  private scope: string = 'guest';
  private backend = new EncryptedStorageBackend();

  async init(userScope: string): Promise<void> {
    this.scope = userScope || 'guest';
    if (!this.key && typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        this.key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (e) {
        console.warn('Failed to generate session crypto key:', e);
      }
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    if (!this.key || typeof crypto === 'undefined' || !crypto.subtle) return;
    try {
      const rawText = JSON.stringify(data);
      const encoded = new TextEncoder().encode(rawText);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.key,
        encoded
      );

      const record: EncryptedRecord = {
        id: `${this.scope}:${key}`,
        scope: this.scope,
        iv,
        ciphertext,
        savedAt: Date.now(),
      };

      await this.backend.put(record);
    } catch (e) {
      console.warn('Encrypted storage write failed:', e);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.key || typeof crypto === 'undefined' || !crypto.subtle) return null;
    try {
      const id = `${this.scope}:${key}`;
      const record = await this.backend.get(id);
      if (!record) return null;

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(record.iv) as unknown as BufferSource },
        this.key,
        record.ciphertext
      );

      const text = new TextDecoder().decode(decrypted);
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    this.key = null;
    await this.backend.clearScope(this.scope);
  }
}

export const encryptedCache = new EncryptedCacheManager();
