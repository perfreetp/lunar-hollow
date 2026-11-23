/**
 * Browser persistence.
 *
 * The whole animation (scenario + playhead) is kept in localStorage so a reload
 * resumes exactly where the user left off. Writes are debounced because the
 * playhead changes on every scrub tick.
 */

import type { Scenario } from '../domain/model'

const STORAGE_KEY = 'apron-sequence.session.v1'
const SAVE_DEBOUNCE_MS = 400

interface StoredSession {
  savedAt: string
  minute: number
  /** Raw scenario JSON, re-validated on load. */
  payload: unknown
}

let timer: number | null = null
let pending: { scenario: Scenario; minute: number } | null = null

function write(): void {
  if (!pending) return
  const { scenario, minute } = pending
  try {
    const session: StoredSession = {
      savedAt: new Date().toISOString(),
      minute,
      payload: scenario,
    }
    const text = JSON.stringify(session)
    localStorage.setItem(STORAGE_KEY, text)
  } catch (error) {
    // Quota exceeded / private mode: persistence is a convenience, never a
    // hard requirement, so surface it once and carry on.
    console.warn('[apron] 本地保存失败', error)
  }
  pending = null
}

export function saveScenario(scenario: Scenario, minute: number): void {
  pending = { scenario, minute }
  if (timer !== null) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    timer = null
    write()
  }, SAVE_DEBOUNCE_MS)
}

export function loadScenario(): { minute: number; payload: unknown } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed || typeof parsed !== 'object') return null
    return { minute: Number(parsed.minute) || 0, payload: parsed.payload }
  } catch (error) {
    console.warn('[apron] 本地读取失败', error)
    return null
  }
}

export function clearScenario(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore: nothing to do if storage is unavailable.
  }
  pending = null
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

/** Force a synchronous flush, e.g. on page hide. */
export function flushScenario(): void {
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
  write()
}
