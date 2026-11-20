/**
 * One user-uploaded wallpaper image, kept in IndexedDB — blobs are too large
 * for the localStorage prefs bag. The active slot is `prefs.wall === 'custom'`.
 */
const DB_NAME = 'hackerscrolls-wall'
const STORE = 'walls'
const KEY = 'custom'
export const CUSTOM_WALL_EVENT = 'hackerscrolls:custom-wall'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'))
  })
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = run(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('wall store request failed'))
        tx.oncomplete = () => db.close()
      }),
  )
}

export async function getCustomWall(): Promise<Blob | undefined> {
  try {
    const blob = await withStore<Blob | undefined>('readonly', (s) => s.get(KEY))
    return blob ?? undefined
  } catch {
    return undefined
  }
}

export async function setCustomWall(blob: Blob): Promise<void> {
  await withStore('readwrite', (s) => s.put(blob, KEY))
  notifyCustomWallChanged()
}

export async function deleteCustomWall(): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(KEY))
  } catch {
    // removing is best-effort; a failed blob never renders anyway
  }
  notifyCustomWallChanged()
}

export function notifyCustomWallChanged(): void {
  window.dispatchEvent(new Event(CUSTOM_WALL_EVENT))
}

export function onCustomWallChange(cb: () => void): () => void {
  window.addEventListener(CUSTOM_WALL_EVENT, cb)
  return () => window.removeEventListener(CUSTOM_WALL_EVENT, cb)
}
