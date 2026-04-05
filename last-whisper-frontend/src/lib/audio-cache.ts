// Audio caching system using IndexedDB
// Provides local storage and retrieval of audio files to avoid repeated API requests

import {debug} from './debug'

interface AudioCacheEntry {
  id: number;
  audioData: ArrayBuffer;
    mimeType: string;
  timestamp: number;
  size: number;
}

class AudioCache {
  private dbName = 'last-whisper-audio-cache';
  private dbVersion = 1;
  private storeName = 'audio';
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

    async getAudio(itemId: number): Promise<{ audioData: ArrayBuffer; mimeType: string } | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(itemId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result as AudioCacheEntry | undefined;
          if (result) {
            // Check if cache entry is still valid
            const age = Date.now() - result.timestamp;
            if (age < this.maxAge) {
                resolve({audioData: result.audioData, mimeType: result.mimeType});
            } else {
              // Remove expired entry
              this.removeAudio(itemId);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
        debug.error('Error getting audio from cache:', error);
      return null;
    }
  }

  async hasAudio(itemId: number): Promise<boolean> {
    const audio = await this.getAudio(itemId);
    return audio !== null;
  }

    async setAudio(itemId: number, audioData: ArrayBuffer, mimeType: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const entry: AudioCacheEntry = {
        id: itemId,
        audioData,
          mimeType,
        timestamp: Date.now(),
        size: audioData.byteLength,
      };

      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          // Check cache size and evict if necessary
          this.evictIfNeeded();
          resolve();
        };
      });
    } catch (error) {
        debug.error('Error setting audio in cache:', error);
    }
  }

  async removeAudio(itemId: number): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.delete(itemId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
        debug.error('Error removing audio from cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('size');

      return new Promise((resolve, reject) => {
        const request = index.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const entries = request.result as AudioCacheEntry[];
          const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
          resolve(totalSize);
        };
      });
    } catch (error) {
        debug.error('Error getting cache size:', error);
      return 0;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
        debug.error('Error clearing cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalSize: number;
    entryCount: number;
    maxSize: number;
    maxAge: number;
  }> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const entries = request.result as AudioCacheEntry[];
          const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

          resolve({
            totalSize,
            entryCount: entries.length,
            maxSize: this.maxCacheSize,
            maxAge: this.maxAge,
          });
        };
      });
    } catch (error) {
        debug.error('Error getting cache stats:', error);
      return {
        totalSize: 0,
        entryCount: 0,
        maxSize: this.maxCacheSize,
        maxAge: this.maxAge,
      };
    }
  }

  private async evictIfNeeded(): Promise<void> {
    try {
      const currentSize = await this.getCacheSize();
      if (currentSize <= this.maxCacheSize) {
        return;
      }

      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');

      // Get all entries sorted by timestamp (oldest first)
      const request = index.getAll();
      request.onsuccess = () => {
        const entries = request.result as AudioCacheEntry[];
        let sizeToRemove = currentSize - this.maxCacheSize;

        // Remove oldest entries until we're under the limit
        for (const entry of entries) {
          if (sizeToRemove <= 0) break;

          store.delete(entry.id);
          sizeToRemove -= entry.size;
        }
      };
    } catch (error) {
        debug.error('Error evicting cache:', error);
    }
  }
}

export const audioCache = new AudioCache();
export default audioCache;
