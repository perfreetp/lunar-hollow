// 浏览器本地持久化:配置用 localStorage,轨迹数据(含 Float32Array)用 IndexedDB

const LS_CONFIG = 'sls.config.v1';
const LS_SHIPS = 'sls.ships.v1';
const DB_NAME = 'ship-lock-sim';
const DB_STORE = 'kv';

export function lsLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function lsSave(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 容量满等异常忽略 */
  }
}

export function loadPersistedConfig<T>(fallback: T): T {
  return lsLoad<T>(LS_CONFIG) ?? fallback;
}
export function loadPersistedShips<T>(fallback: T): T {
  return lsLoad<T>(LS_SHIPS) ?? fallback;
}
export function persistConfig(config: unknown, ships: unknown) {
  lsSave(LS_CONFIG, config);
  lsSave(LS_SHIPS, ships);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* IndexedDB 不可用时静默降级 */
  }
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    const out = await new Promise<T | undefined>((resolve, reject) => {
      const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return out;
  } catch {
    return undefined;
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    /* ignore */
  }
}
