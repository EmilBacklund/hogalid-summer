import { getStore } from '@netlify/blobs';

/**
 * Photo bytes live in Netlify Blobs (SEC M1), not the database. The DB keeps
 * only metadata (`alias, week_start, uploaded_at, mime_type, blob_key`). This
 * interface lets handlers and tests swap the backing store freely.
 */
export interface PhotoStorage {
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<ArrayBuffer | null>;
  delete(key: string): Promise<void>;
}

const STORE_NAME = 'album-photos';

class NetlifyBlobsStorage implements PhotoStorage {
  private store = getStore(STORE_NAME);

  async put(key: string, bytes: Uint8Array): Promise<void> {
    // Copy into a standalone ArrayBuffer so we never pass a view with a
    // non-zero offset / shared buffer to the SDK.
    const copy = bytes.slice();
    await this.store.set(key, copy.buffer as ArrayBuffer);
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const result = await this.store.get(key, { type: 'arrayBuffer' });
    return result ?? null;
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }
}

let instance: PhotoStorage | null = null;

export function getPhotoStorage(): PhotoStorage {
  if (!instance) instance = new NetlifyBlobsStorage();
  return instance;
}

/** Test seam: inject a fake storage implementation. */
export function setPhotoStorageForTests(storage: PhotoStorage | null): void {
  instance = storage;
}
