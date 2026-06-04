import { getStore } from '@netlify/blobs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

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

/**
 * Local-disk store used outside production (dev server + E2E). Netlify Blobs
 * needs the Netlify runtime context, which isn't present under `next dev`, so
 * this keeps the photo feature working locally. Keys can contain `/`, so we
 * mkdir the parent before writing. Files live under a gitignored dir.
 */
const LOCAL_DIR = join(process.cwd(), '.photos-dev');

class FilesystemStorage implements PhotoStorage {
  private path(key: string): string {
    return join(LOCAL_DIR, key);
  }

  async put(key: string, bytes: Uint8Array): Promise<void> {
    const file = this.path(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    try {
      const buf = await readFile(this.path(key));
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }
}

let instance: PhotoStorage | null = null;

export function getPhotoStorage(): PhotoStorage {
  if (!instance) {
    // Production runs on Netlify (Blobs available); dev/test use local disk.
    instance =
      process.env.NODE_ENV === 'production' ? new NetlifyBlobsStorage() : new FilesystemStorage();
  }
  return instance;
}

/** Test seam: inject a fake storage implementation. */
export function setPhotoStorageForTests(storage: PhotoStorage | null): void {
  instance = storage;
}
