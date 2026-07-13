import type { Profile } from './types';

const DB_NAME = 'wafer';
const STORE = 'profiles';
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export function putProfile(p: Profile): Promise<IDBValidKey> {
  return run('readwrite', (s) => s.put(p));
}
export function getAllProfiles(): Promise<Profile[]> {
  return run('readonly', (s) => s.getAll());
}
export function deleteProfileDb(id: string): Promise<undefined> {
  return run('readwrite', (s) => s.delete(id));
}
