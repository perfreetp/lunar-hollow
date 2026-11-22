/**
 * 极简 IndexedDB 封装 —— 存储彩画项目配置与缩略图。
 * 所有方法均为异步，失败时返回安全默认值，不阻断主流程。
 */

const DB_NAME = 'caihua-fade-studio'
const DB_VERSION = 1
const STORE = 'projects'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' })
        store.createIndex('savedAt', 'savedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = fn(transaction.objectStore(STORE))
        request.onsuccess = () => {
          resolve(request.result)
          db.close()
        }
        request.onerror = () => {
          reject(request.error)
          db.close()
        }
      })
  )
}

export const idb = {
  async put<T>(record: T): Promise<void> {
    await tx('readwrite', (store) => store.put(record as unknown as object))
  },

  async get<T>(key: string): Promise<T | undefined> {
    return tx('readonly', (store) => store.get(key) as IDBRequest<T | undefined>)
  },

  async delete(key: string): Promise<void> {
    await tx('readwrite', (store) => store.delete(key))
  },

  async getAll<T>(): Promise<T[]> {
    return tx('readonly', (store) => store.getAll() as IDBRequest<T[]>)
  }
}
